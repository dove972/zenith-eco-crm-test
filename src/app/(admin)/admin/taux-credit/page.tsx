"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ReportType } from "@/types/database";

const MONTHS = [10, 12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180];

interface CreditRate {
  id: string;
  report_type: ReportType;
  months: number;
  rate: number;
}

type RatesMap = Record<number, { id: string; rate: number }>;

export default function CreditRatesPage() {
  const [rates30, setRates30] = useState<RatesMap>({});
  const [rates90, setRates90] = useState<RatesMap>({});
  const [loading, setLoading] = useState(true);
  const [saving30, setSaving30] = useState(false);
  const [saving90, setSaving90] = useState(false);

  const supabase = createClient();

  const fetchRates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("credit_rates")
      .select("id, report_type, months, rate")
      .order("months");

    if (error) {
      toast.error("Erreur lors du chargement des taux de crédit");
      setLoading(false);
      return;
    }

    const map30: RatesMap = {};
    const map90: RatesMap = {};

    (data as CreditRate[]).forEach((row) => {
      const target = row.report_type === "30j" ? map30 : map90;
      target[row.months] = { id: row.id, rate: row.rate };
    });

    setRates30(map30);
    setRates90(map90);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  function handleRateChange(
    reportType: ReportType,
    months: number,
    displayValue: string
  ) {
    const setter = reportType === "30j" ? setRates30 : setRates90;
    setter((prev) => ({
      ...prev,
      [months]: {
        ...prev[months],
        rate: displayValue === "" ? 0 : parseFloat(displayValue) / 100,
      },
    }));
  }

  async function handleSave(reportType: ReportType) {
    const setSaving = reportType === "30j" ? setSaving30 : setSaving90;
    const rates = reportType === "30j" ? rates30 : rates90;

    setSaving(true);

    const updates = MONTHS.map((m) => {
      const entry = rates[m];
      if (!entry?.id) return null;
      return supabase
        .from("credit_rates")
        .update({ rate: entry.rate, updated_at: new Date().toISOString() })
        .eq("id", entry.id);
    }).filter(Boolean);

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r?.error);

    if (hasError) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success(
        `Taux report ${reportType === "30j" ? "30 jours" : "90 jours"} sauvegardés`
      );
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Taux de crédit</h1>
        <p className="text-muted-foreground">
          Gérez les taux de crédit par durée et type de report.
        </p>
      </div>

      <RateSection
        title="Report 30 jours"
        reportType="30j"
        rates={rates30}
        saving={saving30}
        onRateChange={handleRateChange}
        onSave={handleSave}
      />

      <RateSection
        title="Report 90 jours"
        reportType="90j"
        rates={rates90}
        saving={saving90}
        onRateChange={handleRateChange}
        onSave={handleSave}
      />
    </div>
  );
}

function RateSection({
  title,
  reportType,
  rates,
  saving,
  onRateChange,
  onSave,
}: {
  title: string;
  reportType: ReportType;
  rates: RatesMap;
  saving: boolean;
  onRateChange: (reportType: ReportType, months: number, value: string) => void;
  onSave: (reportType: ReportType) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Button onClick={() => onSave(reportType)} disabled={saving} size="sm">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sauvegarder
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Durée
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Taux (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((m) => {
                const entry = rates[m];
                const rateDisplay =
                  entry != null
                    ? (entry.rate * 100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")
                    : "";

                return (
                  <tr key={m} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{m} mois</td>
                    <td className="py-2">
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        className="w-36"
                        value={rateDisplay}
                        onChange={(e) =>
                          onRateChange(reportType, m, e.target.value)
                        }
                        placeholder="0.0000"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
