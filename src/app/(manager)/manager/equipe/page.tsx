"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SIMULATION_STATUS_LABELS } from "@/types";
import { User, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { Profile, Simulation } from "@/types";

interface CommercialData {
  profile: Profile;
  simulations: Simulation[];
  simulationsCount: number;
  acceptedCount: number;
  totalCA: number;
}

export default function EquipePage() {
  const { profile, loading: authLoading } = useAuth();
  const [commercials, setCommercials] = useState<CommercialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    async function loadTeam() {
      const supabase = createClient();

      const { data: teamData } = await supabase
        .from("profiles")
        .select("*")
        .eq("manager_id", profile!.id)
        .eq("active", true)
        .order("last_name");

      const members = teamData ?? [];

      if (members.length === 0) {
        setCommercials([]);
        setLoading(false);
        return;
      }

      const memberIds = members.map((m) => m.id);
      const { data: simData } = await supabase
        .from("simulations")
        .select("*, client:clients(*)")
        .in("commercial_id", memberIds)
        .order("created_at", { ascending: false });

      const allSims = simData ?? [];

      const result: CommercialData[] = members.map((member) => {
        const sims = allSims.filter((s) => s.commercial_id === member.id);
        const accepted = sims.filter((s) => s.status === "accepte");
        return {
          profile: member,
          simulations: sims,
          simulationsCount: sims.length,
          acceptedCount: accepted.length,
          totalCA: accepted.reduce((sum, s) => sum + (s.reste_a_charge ?? 0), 0),
        };
      });

      setCommercials(result);
      setLoading(false);
    }

    loadTeam();
  }, [profile]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mon équipe</h1>

      {commercials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <User className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Aucun commercial dans votre équipe
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {commercials.map((commercial) => {
            const isExpanded = expandedId === commercial.profile.id;
            const recentSims = commercial.simulations.slice(0, 10);

            return (
              <Card key={commercial.profile.id}>
                <button
                  onClick={() => toggleExpand(commercial.profile.id)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {commercial.profile.first_name[0]}
                          {commercial.profile.last_name[0]}
                        </div>
                        <div>
                          <CardTitle className="text-sm">
                            {commercial.profile.first_name}{" "}
                            {commercial.profile.last_name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {commercial.profile.phone ?? "Pas de téléphone"}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <div className="flex gap-3 text-xs">
                      <span className="rounded-md bg-muted px-2 py-1">
                        {commercial.simulationsCount} simulation
                        {commercial.simulationsCount !== 1 ? "s" : ""}
                      </span>
                      <span className="rounded-md bg-green-100 px-2 py-1 text-green-800">
                        {commercial.acceptedCount} accepté
                        {commercial.acceptedCount !== 1 ? "s" : ""}
                      </span>
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-800">
                        CA : {formatCurrency(commercial.totalCA)}
                      </span>
                    </div>
                  </CardContent>
                </button>

                {isExpanded && (
                  <CardContent className="border-t pt-4">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      Dernières simulations
                    </p>
                    {recentSims.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucune simulation
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {recentSims.map((sim) => (
                          <li key={sim.id}>
                            <Link
                              href={`/commercial/simulations/${sim.id}`}
                              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {sim.client
                                    ? `${sim.client.first_name} ${sim.client.last_name}`
                                    : "Client"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(sim.created_at)} ·{" "}
                                  {formatCurrency(sim.reste_a_charge)}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  sim.status === "accepte"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {SIMULATION_STATUS_LABELS[sim.status] ??
                                  sim.status}
                              </Badge>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
