"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { determineMprType } from "@/lib/calculations/simulationEngine";
import type { MprClientType } from "@/types";

interface StepEligibilityProps {
  data: {
    is_owner: boolean;
    is_primary_residence: boolean;
    house_over_2_years: boolean;
    tax_persons_count: number;
    tax_reference_income: number;
    mpr_account_amount: number;
    already_isolated_106: boolean;
    already_isolated_109: boolean;
  };
  mprThresholds: Array<{
    id: string;
    persons_count: number;
    threshold_bleu: number;
    threshold_jaune: number;
    threshold_violet: number;
  }>;
  onNext: (data: StepEligibilityProps["data"]) => void;
  onBack: () => void;
}

const MPR_BADGES: Record<
  MprClientType,
  { label: string; className: string }
> = {
  bleu: {
    label: "Bleu - Très modeste",
    className: "bg-blue-500 text-white",
  },
  jaune: {
    label: "Jaune - Modeste",
    className: "bg-yellow-400 text-black",
  },
  violet: {
    label: "Violet - Intermédiaire",
    className: "bg-purple-500 text-white",
  },
  rose: {
    label: "Rose - Supérieur",
    className: "bg-pink-400 text-white",
  },
};

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          value ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            value && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

function YesNoButtons({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium flex-1">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-bold transition-all",
            value
              ? "bg-[#FA7800] text-white shadow-sm"
              : "bg-[#F5F5F5] text-[#888] hover:bg-[#E0E0E0]"
          )}
        >
          Oui
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-bold transition-all",
            !value
              ? "bg-[#464646] text-white shadow-sm"
              : "bg-[#F5F5F5] text-[#888] hover:bg-[#E0E0E0]"
          )}
        >
          Non
        </button>
      </div>
    </div>
  );
}

export default function StepEligibility({
  data,
  mprThresholds,
  onNext,
  onBack,
}: StepEligibilityProps) {
  const [formData, setFormData] = useState(data);

  const update = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const mprType = useMemo(
    () =>
      determineMprType(
        formData.tax_reference_income,
        formData.tax_persons_count,
        mprThresholds
      ),
    [formData.tax_reference_income, formData.tax_persons_count, mprThresholds]
  );

  const badge = MPR_BADGES[mprType];

  // Compute threshold amounts for current person count
  const currentThresholds = useMemo(() => {
    const row = mprThresholds.find((t) => t.persons_count === formData.tax_persons_count);
    if (row) {
      return {
        bleu: row.threshold_bleu,
        jaune: row.threshold_jaune,
        violet: row.threshold_violet,
      };
    }
    // Extrapolate for > 5 persons
    const maxRow = mprThresholds.reduce((max, t) =>
      t.persons_count > max.persons_count ? t : max
    , mprThresholds[0]);
    if (!maxRow) return null;
    const row5 = mprThresholds.find((t) => t.persons_count === 5);
    const row6 = mprThresholds.find((t) => t.persons_count === 6);
    if (!row5 || !row6) return { bleu: maxRow.threshold_bleu, jaune: maxRow.threshold_jaune, violet: maxRow.threshold_violet };
    const extra = formData.tax_persons_count - maxRow.persons_count;
    return {
      bleu: maxRow.threshold_bleu + extra * (row6.threshold_bleu - row5.threshold_bleu),
      jaune: maxRow.threshold_jaune + extra * (row6.threshold_jaune - row5.threshold_jaune),
      violet: maxRow.threshold_violet + extra * (row6.threshold_violet - row5.threshold_violet),
    };
  }, [formData.tax_persons_count, mprThresholds]);

  const formatEuro = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Éligibilité</h2>

      {/* Toggles propriétaire / résidence / ancienneté */}
      <div className="space-y-4 rounded-lg border p-4">
        <Toggle
          label="Propriétaire ?"
          value={formData.is_owner}
          onChange={(v) => update("is_owner", v)}
        />
        <Toggle
          label="Résidence principale ?"
          value={formData.is_primary_residence}
          onChange={(v) => update("is_primary_residence", v)}
        />
        <Toggle
          label="Maison de +2 ans ?"
          value={formData.house_over_2_years}
          onChange={(v) => update("house_over_2_years", v)}
        />
      </div>

      {/* Nombre de personnes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Nombre de personnes sur avis d&apos;impôt
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={formData.tax_persons_count <= 1}
            onClick={() =>
              update("tax_persons_count", formData.tax_persons_count - 1)
            }
          >
            −
          </Button>
          <input
            type="number"
            inputMode="numeric"
            className="w-14 rounded-md border border-input bg-background text-center text-lg font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            value={formData.tax_persons_count}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 10) update("tax_persons_count", v);
            }}
            min={1}
            max={10}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={formData.tax_persons_count >= 10}
            onClick={() =>
              update("tax_persons_count", formData.tax_persons_count + 1)
            }
          >
            +
          </Button>
        </div>
      </div>

      {/* Revenu fiscal */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Revenu fiscal de référence (€)
        </label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={formData.tax_reference_income || ""}
          onFocus={(e) => e.target.select()}
          onChange={(e) =>
            update("tax_reference_income", Number(e.target.value))
          }
          placeholder="Ex : 25 000"
        />
      </div>

      {/* Badge MPR temps réel + seuils */}
      <div className="rounded-[14px] border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Profil MPR :</span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              badge.className
            )}
          >
            {badge.label}
          </span>
        </div>
        {currentThresholds && (
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-muted-foreground">Bleu ≤ {formatEuro(currentThresholds.bleu)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-muted-foreground">Jaune ≤ {formatEuro(currentThresholds.jaune)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-muted-foreground">Violet ≤ {formatEuro(currentThresholds.violet)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-400 shrink-0" />
              <span className="text-muted-foreground">Rose &gt; {formatEuro(currentThresholds.violet)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Isolation 106/109 - Boutons Oui/Non */}
      <div className="space-y-4 rounded-lg border p-4">
        <YesNoButtons
          label="Déjà isolé BAR-EN-106 ?"
          value={formData.already_isolated_106}
          onChange={(v) => update("already_isolated_106", v)}
        />
        <YesNoButtons
          label="Déjà isolé BAR-EN-109 ?"
          value={formData.already_isolated_109}
          onChange={(v) => update("already_isolated_109", v)}
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => onNext(formData)}
        >
          Suivant
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
