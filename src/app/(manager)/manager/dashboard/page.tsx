"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { Users, FileText, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import type { Profile, Simulation } from "@/types";

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

export default function ManagerDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<Profile[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("this_month");

  useEffect(() => {
    if (!profile) return;

    async function loadData() {
      const supabase = createClient();

      const { data: teamData } = await supabase
        .from("profiles")
        .select("*")
        .eq("manager_id", profile!.id)
        .eq("active", true);

      const members = teamData ?? [];
      setTeam(members);

      if (members.length === 0) {
        setSimulations([]);
        setLoading(false);
        return;
      }

      const memberIds = members.map((m) => m.id);
      const { data: simData } = await supabase
        .from("simulations")
        .select("*")
        .in("commercial_id", memberIds)
        .order("created_at", { ascending: false });

      setSimulations(simData ?? []);
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
    const accepted = filteredSimulations.filter((s) => s.status === "accepte");
    return {
      teamCount: team.length,
      simulationsCount: filteredSimulations.length,
      acceptedCount: accepted.length,
      revenue: accepted.reduce((sum, s) => sum + (s.reste_a_charge ?? 0), 0),
    };
  }, [filteredSimulations, team]);

  const perCommercial = useMemo(() => {
    const map = new Map<string, { profile: Profile; count: number; accepted: number }>();
    team.forEach((member) => {
      map.set(member.id, { profile: member, count: 0, accepted: 0 });
    });
    filteredSimulations.forEach((sim) => {
      const entry = map.get(sim.commercial_id);
      if (entry) {
        entry.count++;
        if (sim.status === "accepte") entry.accepted++;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredSimulations, team]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FA7800]" />
      </div>
    );
  }

  const kpis = [
    { label: "Commerciaux", value: stats.teamCount, icon: Users, color: "#1565C0" },
    { label: "Simulations", value: stats.simulationsCount, icon: FileText, color: "#FA7800" },
    { label: "Devis acceptés", value: stats.acceptedCount, icon: CheckCircle, color: "#43A047" },
    { label: "Chiffre d'affaires", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "#FAA032" },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header + Period filter */}
      <div className="flex items-center justify-between">
        <h1 className="text-[1.4rem] font-extrabold text-[#464646]">Dashboard</h1>
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
            <kpi.icon className="h-5 w-5 mb-3" style={{ color: kpi.color }} />
            <p className="font-heading text-[1.5rem] font-extrabold text-[#464646] leading-none">
              {kpi.value}
            </p>
            <p className="text-[12px] text-[#888] mt-1.5 font-medium">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Per-commercial */}
      <div className="rounded-[14px] bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <h2 className="font-heading text-[1.05rem] font-bold text-[#464646] ">
            Simulations par commercial
          </h2>
        </div>
        <div className="p-5">
          {perCommercial.length === 0 ? (
            <p className="text-sm text-[#888]">Aucun commercial dans l&apos;équipe.</p>
          ) : (
            <ul className="space-y-3">
              {perCommercial.map(({ profile: member, count, accepted }) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-[10px] border border-[#F5F5F5] p-3 transition-colors hover:bg-[#FFFCF8]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FA7800]/10 text-xs font-bold text-[#FA7800]">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <span className="text-sm font-semibold text-[#464646]">
                      {member.first_name} {member.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-xs font-bold text-[#505050]">
                      {count} sim.
                    </span>
                    {accepted > 0 && (
                      <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#43A047]">
                        {accepted} accepté{accepted > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
