"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const COLORS = ["bleu", "jaune", "violet", "rose"] as const;
type Color = (typeof COLORS)[number];

const COLOR_LABELS: Record<Color, string> = {
  bleu: "Bleu",
  jaune: "Jaune",
  violet: "Violet",
  rose: "Rose",
};

const PERSON_LABELS: Record<number, string> = {
  1: "1 personne",
  2: "2 personnes",
  3: "3 personnes",
  4: "4 personnes",
  5: "5 personnes",
  6: "Par personne supplémentaire",
};

interface MprThreshold {
  id: string;
  persons_count: number;
  threshold_bleu: number;
  threshold_jaune: number;
  threshold_violet: number;
}

interface MprRate {
  id: string;
  operation: string;
  bleu: number;
  jaune: number;
  violet: number;
  rose: number;
}

const OPERATION_LABELS: Record<string, string> = {
  bar_en_106: "BAR-EN-106 (Isolation rampants)",
  bar_en_109: "BAR-EN-109 (Protection parois opaques)",
};

export default function BaremesMprPage() {
  const supabase = createClient();

  const [thresholds, setThresholds] = useState<MprThreshold[]>([]);
  const [rates, setRates] = useState<MprRate[]>([]);
  const [loadingThresholds, setLoadingThresholds] = useState(true);
  const [loadingRates, setLoadingRates] = useState(true);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [savingRates, setSavingRates] = useState(false);

  useEffect(() => {
    fetchThresholds();
    fetchRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchThresholds() {
    setLoadingThresholds(true);
    const { data, error } = await supabase
      .from("mpr_thresholds")
      .select("*")
      .order("persons_count");

    if (error) {
      toast.error("Erreur lors du chargement des plafonds");
    } else {
      setThresholds(data ?? []);
    }
    setLoadingThresholds(false);
  }

  async function fetchRates() {
    setLoadingRates(true);
    const { data, error } = await supabase
      .from("mpr_rates")
      .select("*")
      .order("operation");

    if (error) {
      toast.error("Erreur lors du chargement des aides au m²");
    } else {
      setRates(data ?? []);
    }
    setLoadingRates(false);
  }

  function updateThreshold(
    index: number,
    field: "threshold_bleu" | "threshold_jaune" | "threshold_violet",
    value: string
  ) {
    setThresholds((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Number(value) || 0 };
      return updated;
    });
  }

  function updateRate(index: number, field: Color, value: string) {
    setRates((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Number(value) || 0 };
      return updated;
    });
  }

  async function saveThresholds() {
    setSavingThresholds(true);
    const promises = thresholds.map((t) => {
      const payload: Database["public"]["Tables"]["mpr_thresholds"]["Update"] =
        {
          threshold_bleu: t.threshold_bleu,
          threshold_jaune: t.threshold_jaune,
          threshold_violet: t.threshold_violet,
        };
      return supabase
        .from("mpr_thresholds")
        .update(payload as never)
        .eq("id", t.id);
    });

    const results = await Promise.all(promises);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      toast.error("Erreur lors de la sauvegarde des plafonds");
    } else {
      toast.success("Plafonds sauvegardés avec succès");
    }
    setSavingThresholds(false);
  }

  async function saveRates() {
    setSavingRates(true);
    const promises = rates.map((r) => {
      const payload: Database["public"]["Tables"]["mpr_rates"]["Update"] = {
        bleu: r.bleu,
        jaune: r.jaune,
        violet: r.violet,
        rose: r.rose,
      };
      return supabase
        .from("mpr_rates")
        .update(payload as never)
        .eq("id", r.id);
    });

    const results = await Promise.all(promises);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      toast.error("Erreur lors de la sauvegarde des aides");
    } else {
      toast.success("Aides au m² sauvegardées avec succès");
    }
    setSavingRates(false);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Barèmes MaPrimeRénov&apos;</h1>

      {/* Section 1: Plafonds de ressources */}
      <Card>
        <CardHeader>
          <CardTitle>Plafonds de ressources MPR</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingThresholds ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 pr-4 text-left font-medium">
                        Nombre de parts
                      </th>
                      <th className="px-2 py-3 text-center font-medium">
                        Bleu
                      </th>
                      <th className="px-2 py-3 text-center font-medium">
                        Jaune
                      </th>
                      <th className="px-2 py-3 text-center font-medium">
                        Violet
                      </th>
                      <th className="px-2 py-3 text-center font-medium text-muted-foreground">
                        Rose (au-dessus)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {thresholds.map((t, i) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">
                          {PERSON_LABELS[t.persons_count] ??
                            `${t.persons_count} personnes`}
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            value={t.threshold_bleu}
                            onChange={(e) =>
                              updateThreshold(i, "threshold_bleu", e.target.value)
                            }
                            className="w-28 text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            value={t.threshold_jaune}
                            onChange={(e) =>
                              updateThreshold(i, "threshold_jaune", e.target.value)
                            }
                            className="w-28 text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            value={t.threshold_violet}
                            onChange={(e) =>
                              updateThreshold(i, "threshold_violet", e.target.value)
                            }
                            className="w-28 text-right"
                          />
                        </td>
                        <td className="px-2 py-3 text-center text-muted-foreground">
                          &gt; Violet
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={saveThresholds} disabled={savingThresholds}>
                  {savingThresholds && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer les plafonds
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Aides MPR au m² */}
      <Card>
        <CardHeader>
          <CardTitle>Aides MPR au m²</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRates ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 pr-4 text-left font-medium">
                        Opération
                      </th>
                      {COLORS.map((c) => (
                        <th
                          key={c}
                          className="px-2 py-3 text-center font-medium"
                        >
                          {COLOR_LABELS[c]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((r, i) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">
                          {OPERATION_LABELS[r.operation] ?? r.operation}
                        </td>
                        {COLORS.map((c) => (
                          <td key={c} className="px-2 py-2">
                            <Input
                              type="number"
                              value={r[c]}
                              onChange={(e) =>
                                updateRate(i, c, e.target.value)
                              }
                              className="w-28 text-right"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={saveRates} disabled={savingRates}>
                  {savingRates && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer les aides
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
