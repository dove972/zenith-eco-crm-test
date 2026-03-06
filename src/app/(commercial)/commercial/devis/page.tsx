"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DEVIS_STATUS_LABELS } from "@/types";
import type { Devis, Simulation, Client } from "@/types";
import {
  Search,
  Receipt,
  Loader2,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";

type DevisWithDetails = Devis & {
  simulation: Simulation & { client: Client | null };
};

type DevisStatusFilter = "all" | Devis["status"];
type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

const STATUS_FILTERS: { value: DevisStatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "brouillon", label: "Brouillon" },
  { value: "envoye", label: "Envoy\u00e9" },
  { value: "accepte", label: "Accept\u00e9" },
  { value: "refuse", label: "Refus\u00e9" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date_desc", label: "Plus r\u00e9cent" },
  { value: "date_asc", label: "Plus ancien" },
  { value: "amount_desc", label: "Montant \u2193" },
  { value: "amount_asc", label: "Montant \u2191" },
];

const DEVIS_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: "#F5F5F5", text: "#505050" },
  envoye: { bg: "#FFF3E0", text: "#FA7800" },
  accepte: { bg: "#E8F5E9", text: "#43A047" },
  refuse: { bg: "#FFEBEE", text: "#E53935" },
  expire: { bg: "#FFF8E1", text: "#F9A825" },
};

export default function DevisListPage() {
  const { profile, loading: authLoading } = useAuth();
  const [devisList, setDevisList] = useState<DevisWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DevisStatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");

  useEffect(() => {
    if (!profile) return;

    async function fetchDevis() {
      const supabase = createClient();

      // Try direct query with join through simulations
      const { data, error } = await supabase
        .from("devis")
        .select("*, simulation:simulations(*, client:clients(*))")
        .order("created_at", { ascending: false });

      if (error || !data) {
        // Fallback: fetch commercial's simulation IDs first, then devis
        const { data: sims } = await supabase
          .from("simulations")
          .select("id");

        if (sims && sims.length > 0) {
          const simIds = sims.map((s) => s.id);
          const { data: devisData } = await supabase
            .from("devis")
            .select("*, simulation:simulations(*, client:clients(*))")
            .in("simulation_id", simIds)
            .order("created_at", { ascending: false });

          setDevisList((devisData as DevisWithDetails[]) ?? []);
        } else {
          setDevisList([]);
        }
      } else {
        setDevisList((data as DevisWithDetails[]) ?? []);
      }

      setLoading(false);
    }

    fetchDevis();
  }, [profile]);

  const filteredDevis = useMemo(() => {
    let result = devisList.filter((d) => {
      // Status filter
      if (statusFilter !== "all" && d.status !== statusFilter) return false;

      // Search filter
      if (search.trim()) {
        const clientName =
          `${d.simulation?.client?.first_name ?? ""} ${d.simulation?.client?.last_name ?? ""}`.toLowerCase();
        const devisNum = (d.devis_number ?? "").toLowerCase();
        const query = search.toLowerCase();
        if (!clientName.includes(query) && !devisNum.includes(query))
          return false;
      }

      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        case "date_asc":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        case "amount_desc":
          return (
            (b.simulation?.reste_a_charge ?? 0) -
            (a.simulation?.reste_a_charge ?? 0)
          );
        case "amount_asc":
          return (
            (a.simulation?.reste_a_charge ?? 0) -
            (b.simulation?.reste_a_charge ?? 0)
          );
        default:
          return 0;
      }
    });

    return result;
  }, [devisList, search, statusFilter, sortBy]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FA7800]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.4rem] font-extrabold text-[#464646]">Devis</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ccc]" />
        <input
          type="text"
          placeholder="Rechercher par client ou n\u00b0 devis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[10px] border border-[#E0E0E0] bg-white py-3 pl-10 pr-4 text-sm text-[#333] transition-all placeholder:text-[#ccc] focus:border-[#FA7800] focus:outline-none focus:ring-2 focus:ring-[#FA7800]/15"
        />
      </div>

      {/* Status filters + Sort */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                statusFilter === filter.value
                  ? "bg-[#FA7800] text-white"
                  : "bg-white text-[#888] border border-[#E0E0E0] hover:border-[#FA7800] hover:text-[#FA7800]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <ArrowUpDown className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#888] pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none rounded-[8px] border border-[#E0E0E0] bg-white py-2 pl-8 pr-6 text-xs font-semibold text-[#464646] transition-colors hover:border-[#FA7800] focus:border-[#FA7800] focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Devis list */}
      {filteredDevis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F5]">
            <Receipt className="h-6 w-6 text-[#E0E0E0]" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[#888]">
            Aucun devis trouv\u00e9
          </p>
          <p className="mt-1 text-xs text-[#ccc]">
            {search || statusFilter !== "all"
              ? "Essayez de modifier vos filtres"
              : "Vos devis apparaitront ici"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDevis.map((d) => {
            const statusStyle = DEVIS_STATUS_COLORS[d.status] ?? {
              bg: "#F5F5F5",
              text: "#505050",
            };
            const clientName = d.simulation?.client
              ? `${d.simulation.client.first_name} ${d.simulation.client.last_name}`
              : "Client inconnu";

            return (
              <Link
                key={d.id}
                href={`/commercial/simulations/${d.simulation_id}/devis`}
                className="block"
              >
                <div className="rounded-[14px] bg-white p-4 shadow-card transition-all hover:-translate-y-px hover:shadow-md active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#464646]">
                        {clientName}
                      </p>
                      <p className="text-xs text-[#888] mt-0.5">
                        N\u00b0 {d.devis_number} \u2014{" "}
                        {formatDate(d.created_at)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {DEVIS_STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#F5F5F5] pt-3 text-sm">
                    <span className="text-[#888] text-xs">
                      {d.simulation?.surface_m2} m\u00b2
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#464646]">
                        {formatCurrency(
                          d.simulation?.reste_a_charge ?? 0
                        )}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#E0E0E0]" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
