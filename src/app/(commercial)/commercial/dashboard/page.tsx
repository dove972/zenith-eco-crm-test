"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SIMULATION_STATUS_LABELS } from "@/types";
import type { Simulation } from "@/types";
import {
  FileText,
  Send,
  CheckCircle,
  TrendingUp,
  Loader2,
  ChevronRight,
} from "lucide-react";

type Period = "this_month" | "last_month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  this_month: "Ce mois",
  last_month: "Mois dernier",
  all: "Tout",
};

function getDateRange(period: Period): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (period === "this_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }
  if (period === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  }
  return { from: null, to: null };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: "#F5F5F5", text: "#505050" },
  devis_envoye: { bg: "#FFF3E0", text: "#FA7800" },
  accepte: { bg: "#E8F5E9", text: "#43A047" },
  refuse: { bg: "#FFEBEE", text: "#E53935" },
};

export default function CommercialDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("this_month");

  useEffect(() => {
    if (!profile) return;

    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("simulations")
        .select("*, client:clients(*)")
        .order("created_at", { ascending: false });

      setSimulations((data as Simulation[]) ?? []);
      setLoading(false);
    }

    loadData();
  }, [profile]);

  const filteredSimulations = useMemo(() => {
    const { from, to } = getDateRange(period);
    if (!from || !to) return simulations;
    return simulations.filter((s) => {
      const d = new Date(s.created_at);
      return d >= from && d <= to;
    });
  }, [simulations, period]);

  const stats = useMemo(() => {
    const sent = filteredSimulations.filter(
      (s) => s.status === "devis_envoye"
    );
    const accepted = filteredSimulations.filter((s) => s.status === "accepte");
    return {
      simulationsCount: filteredSimulations.length,
      sentCount: sent.length,
      acceptedCount: accepted.length,
      revenue: accepted.reduce(
        (sum, s) => sum + (s.reste_a_charge ?? 0),
        0
      ),
    };
  }, [filteredSimulations]);

  const recentSimulations = useMemo(() => {
    return simulations.slice(0, 5);
  }, [simulations]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FA7800]" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Simulations",
      value: stats.simulationsCount,
      icon: FileText,
      color: "#1565C0",
    },
    {
      label: "Devis envoy\u00e9s",
      value: stats.sentCount,
      icon: Send,
      color: "#FA7800",
    },
    {
      label: "Devis accept\u00e9s",
      value: stats.acceptedCount,
      icon: CheckCircle,
      color: "#43A047",
    },
    {
      label: "Chiffre d\u2019affaires",
      value: formatCurrency(stats.revenue),
      icon: TrendingUp,
      color: "#FAA032",
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header + Period filter */}
      <div className="flex items-center justify-between">
        <h1 className="text-[1.4rem] font-extrabold text-[#464646]">
          Dashboard
        </h1>
        <div className="flex gap-1 rounded-[10px] border border-[#E0E0E0] bg-white p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p
                  ? "bg-[#FA7800] text-white"
                  : "text-[#888] hover:text-[#464646]"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[14px] bg-white p-5 shadow-card"
            style={{ borderTop: `4px solid ${kpi.color}` }}
          >
            <kpi.icon
              className="h-5 w-5 mb-3"
              style={{ color: kpi.color }}
            />
            <p className="font-heading text-[1.5rem] font-extrabold text-[#464646] leading-none">
              {kpi.value}
            </p>
            <p className="text-[12px] text-[#888] mt-1.5 font-medium">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-[14px] bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <h2 className="font-heading text-[1.05rem] font-bold text-[#464646]">
            Activit\u00e9 r\u00e9cente
          </h2>
        </div>
        <div className="p-4">
          {recentSimulations.length === 0 ? (
            <p className="text-sm text-[#888] py-4 text-center">
              Aucune simulation pour le moment.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentSimulations.map((simulation) => {
                const statusStyle = STATUS_COLORS[simulation.status] ?? {
                  bg: "#F5F5F5",
                  text: "#505050",
                };
                return (
                  <Link
                    key={simulation.id}
                    href={`/commercial/simulations/${simulation.id}`}
                    className="block"
                  >
                    <div className="rounded-[10px] border border-[#F5F5F5] p-3 transition-colors hover:bg-[#FFFCF8]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#464646]">
                            {simulation.client
                              ? `${simulation.client.first_name} ${simulation.client.last_name}`
                              : "Client inconnu"}
                          </p>
                          <p className="text-xs text-[#888] mt-0.5">
                            {formatDate(simulation.created_at)}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                          }}
                        >
                          {SIMULATION_STATUS_LABELS[simulation.status] ??
                            simulation.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-[#888] text-xs">
                          {simulation.surface_m2} m\u00b2
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
      </div>
    </div>
  );
}
