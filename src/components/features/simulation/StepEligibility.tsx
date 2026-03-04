"use client";

import { useState, useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { determineMprType } from "@/lib/calculations/simulationEngine";
import type { MprClientType } from "@/types";
import Image from "next/image";

export interface PhotoSlot {
  label: string;
  file: File | null;
  preview: string | null;
}

const PHOTO_LABELS = [
  "Pièce d'identité",
  "Avis d'impôt",
  "Taxe foncière",
  "Justificatif de domicile",
  "Autre document",
];

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
  photos?: PhotoSlot[];
  onPhotosChange?: (photos: PhotoSlot[]) => void;
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

export default function StepEligibility({
  data,
  mprThresholds,
  photos: externalPhotos,
  onPhotosChange,
  onNext,
  onBack,
}: StepEligibilityProps) {
  const [formData, setFormData] = useState(data);
  const [localPhotos, setLocalPhotos] = useState<PhotoSlot[]>(
    externalPhotos ??
      PHOTO_LABELS.map((label) => ({ label, file: null, preview: null }))
  );
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

      {/* Badge MPR temps réel */}
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

      {/* Montant compte MPR */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Plafond compte MPR (€)
        </label>
        <p className="text-xs text-muted-foreground -mt-1">
          Laissez vide ou à 0 pour ne pas plafonner la prime
        </p>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={formData.mpr_account_amount || ""}
          onFocus={(e) => e.target.select()}
          onChange={(e) =>
            update("mpr_account_amount", Number(e.target.value))
          }
          placeholder="Ex : 7 000"
        />
      </div>

      {/* Toggles isolation */}
      <div className="space-y-4 rounded-lg border p-4">
        <Toggle
          label="Déjà isolé BAR-EN-106 ?"
          value={formData.already_isolated_106}
          onChange={(v) => update("already_isolated_106", v)}
        />
        <Toggle
          label="Déjà isolé BAR-EN-109 ?"
          value={formData.already_isolated_109}
          onChange={(v) => update("already_isolated_109", v)}
        />
      </div>

      {/* Photos client */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#464646]">
          Photos client (optionnel)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {localPhotos.map((slot, index) => (
            <div key={slot.label} className="space-y-1.5">
              <p className="text-[11px] font-medium text-[#888] truncate">
                {slot.label}
              </p>
              <div className="relative aspect-[4/3] rounded-lg border-2 border-dashed border-[#E0E0E0] bg-[#FAFAFA] overflow-hidden">
                {slot.preview ? (
                  <>
                    <Image
                      src={slot.preview}
                      alt={slot.label}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...localPhotos];
                        if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
                        updated[index] = { ...updated[index], file: null, preview: null };
                        setLocalPhotos(updated);
                        onPhotosChange?.(updated);
                      }}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#ccc] hover:text-[#FA7800] transition-colors"
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Photo</span>
                  </button>
                )}
                <input
                  ref={(el) => { fileInputRefs.current[index] = el; }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const preview = URL.createObjectURL(file);
                    const updated = [...localPhotos];
                    if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
                    updated[index] = { ...updated[index], file, preview };
                    setLocalPhotos(updated);
                    onPhotosChange?.(updated);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          ))}
        </div>
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
