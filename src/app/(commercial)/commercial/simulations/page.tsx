"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SIMULATION_STATUS_LABELS } from "@/types";
import type { Simulation } from "@/types";
import { Search, FileText, Loader2, ChevronRight } from "lucide-react";
import { useSimulationBasePath } from "@/hooks/use-simulation-paths";

type SimulationStatus = Simulation["status"];

const STATUS_FILTERS: { value: "all" | SimulationStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "brouillon", label: "Brouillon" },
  { value: "devis_envoye", label: "Devis envoyé" },
  { value: "accepte", label: "Accepté" },
  { value: "refuse", label: "Refusé" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: "#F5F5F5", text: "#505050" },
  devis_envoye: { bg: "#FFF3E0", text: "#FA7800" },
  accepte: { bg: "#E8F5E9", text: "#43A047" },
  refuse: { bg: "#FFEBEE", text: "#E53935" },
};

export default function SimulationsPage() {
  const basePath = useSimulationBasePath();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SimulationStatus>("all");

  useEffect(() => {
    async function fetchSimulations() {
      const supabase = createClient();
      const { data } = await supabase
        .from("simulations")
        .select("*, client:clients(*)")
        .order("created_at", { ascending: false });

      setSimulations((data as Simulation[]) ?? []);
      setLoading(false);
    }

    fetchSimulations();
  }, []);

  const filteredSimulations = useMemo(() => {
    return simulations.filter((sim) => {
      if (statusFilter !== "all" && sim.status !== statusFilter) return false;

      if (search.trim()) {
        const clientName =
          `${sim.client?.first_name ?? ""} ${sim.client?.last_name ?? ""}`.toLowerCase();
        if (!clientName.includes(search.toLowerCase())) return false;
      }

      return true;
    });
  }, [simulations, search, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FA7800]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.4rem] font-extrabold text-[#464646]">Simulations</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ccc]" />
        <input
          type="text"
          placeholder="Rechercher par nom de client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[10px] border border-[#E0E0E0] bg-white py-3 pl-10 pr-4 text-sm text-[#333] transition-all placeholder:text-[#ccc] focus:border-[#FA7800] focus:outline-none focus:ring-2 focus:ring-[#FA7800]/15"
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-thin">
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

      {/* Simulation list */}
      {filteredSimulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F5]">
            <FileText className="h-6 w-6 text-[#E0E0E0]" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[#888]">
            Aucune simulation trouvée
          </p>
          <p className="mt-1 text-xs text-[#ccc]">
            {search || statusFilter !== "all"
              ? "Essayez de modifier vos filtres"
              : "Vos simulations apparaîtront ici"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSimulations.map((simulation) => {
            const statusStyle = STATUS_COLORS[simulation.status] ?? { bg: "#F5F5F5", text: "#505050" };
            return (
              <Link
                key={simulation.id}
                href={`${basePath}/${simulation.id}`}
                className="block"
              >
                <div className="rounded-[14px] bg-white p-4 shadow-card transition-all hover:-translate-y-px hover:shadow-md active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#464646]">
                        {simulation.client
                          ? `${simulation.client.first_name} ${simulation.client.last_name}`
                          : "Client inconnu"}
                      </p>
                      <p className="text-xs text-[#888] mt-1">
                        {formatDate(simulation.created_at)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      {SIMULATION_STATUS_LABELS[simulation.status] ?? simulation.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#F5F5F5] pt-3 text-sm">
                    <span className="text-[#888] text-xs">
                      {simulation.surface_m2} m²
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#464646]">
                        {formatCurrency(simulation.reste_a_charge)}
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
