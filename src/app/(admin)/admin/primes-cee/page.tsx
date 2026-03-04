"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

const OPERATION_LABELS: Record<string, string> = {
  bar_en_106: "BAR-EN-106 (Isolation rampants)",
  bar_en_109: "BAR-EN-109 (Réflecteur solaire)",
};

interface CeeRate {
  id: string;
  operation: string;
  bleu: number;
  jaune: number;
  violet: number;
  rose: number;
}

export default function PrimesCeePage() {
  const supabase = createClient();

  const [rates, setRates] = useState<CeeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRates() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cee_rates")
      .select("*")
      .order("operation");

    if (error) {
      toast.error("Erreur lors du chargement des primes CEE");
    } else {
      setRates(data ?? []);
    }
    setLoading(false);
  }

  function updateRate(index: number, field: Color, value: string) {
    setRates((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Number(value) || 0 };
      return updated;
    });
  }

  async function saveRates() {
    setSaving(true);
    const promises = rates.map((r) =>
      supabase
        .from("cee_rates")
        .update({
          bleu: r.bleu,
          jaune: r.jaune,
          violet: r.violet,
          rose: r.rose,
        })
        .eq("id", r.id)
    );

    const results = await Promise.all(promises);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      toast.error("Erreur lors de la sauvegarde des primes CEE");
    } else {
      toast.success("Primes CEE sauvegardées avec succès");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Primes CEE</h1>

      <Card>
        <CardHeader>
          <CardTitle>Montants des primes CEE</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
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
                <Button onClick={saveRates} disabled={saving}>
                  {saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer les primes
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
