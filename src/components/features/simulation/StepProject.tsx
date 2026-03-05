"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface StepProjectProps {
  data: {
    sheet_type: "acier" | "alu";
    roof_panels_count: number;
    needs_framework: boolean;
    surface_m2: number;
    products: Array<{ product_id: string; quantity: number }>;
  };
  salePrices: Array<{ id: string; label: string; price_per_m2: number }>;
  complementaryProducts: Array<{
    id: string;
    name: string;
    category: string;
    unit_price_sell: number;
    unit_label: string;
  }>;
  onNext: (data: StepProjectProps["data"]) => void;
  onBack: () => void;
}

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

function findSalePrice(
  salePrices: StepProjectProps["salePrices"],
  sheetType: "acier" | "alu",
  needsFramework: boolean
): { label: string; price_per_m2: number } | undefined {
  let label: string;
  if (needsFramework) {
    label = sheetType === "acier" ? "charpente_toles_acier" : "charpente_toles_alu";
  } else {
    label = sheetType === "acier" ? "toles_acier" : "toles_alu";
  }
  return salePrices.find((sp) => sp.label === label);
}

export default function StepProject({
  data,
  salePrices,
  complementaryProducts,
  onNext,
  onBack,
}: StepProjectProps) {
  const [formData, setFormData] = useState(data);

  const update = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setFormData((prev) => {
      const existing = prev.products.find((p) => p.product_id === productId);
      if (existing) {
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.product_id === productId ? { ...p, quantity } : p
          ),
        };
      }
      return {
        ...prev,
        products: [...prev.products, { product_id: productId, quantity }],
      };
    });
  };

  const getProductQuantity = (productId: string): number =>
    formData.products.find((p) => p.product_id === productId)?.quantity ?? 0;

  // Correspondance exacte pour éviter que "charpente_toles_acier" matche avant "toles_acier"
  const acierPrice = salePrices.find((sp) => sp.label === "toles_acier");
  const aluPrice = salePrices.find((sp) => sp.label === "toles_alu");

  const activePrice = findSalePrice(
    salePrices,
    formData.sheet_type,
    formData.needs_framework
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Projet</h2>

      {/* Type de tôle */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type de tôle</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update("sheet_type", "acier")}
            className={cn(
              "rounded-lg border-2 p-4 text-center transition-colors",
              formData.sheet_type === "acier"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/30"
            )}
          >
            <span className="block text-sm font-semibold">ACIER</span>
            {acierPrice && (
              <span className="mt-1 block text-xs text-muted-foreground">
                {formatCurrency(acierPrice.price_per_m2)} / m²
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => update("sheet_type", "alu")}
            className={cn(
              "rounded-lg border-2 p-4 text-center transition-colors",
              formData.sheet_type === "alu"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/30"
            )}
          >
            <span className="block text-sm font-semibold">ALU</span>
            {aluPrice && (
              <span className="mt-1 block text-xs text-muted-foreground">
                {formatCurrency(aluPrice.price_per_m2)} / m²
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Nombre de pans */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre de pans</label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={formData.roof_panels_count <= 1}
            onClick={() =>
              update("roof_panels_count", formData.roof_panels_count - 1)
            }
          >
            −
          </Button>
          <input
            type="number"
            inputMode="numeric"
            className="w-14 rounded-md border border-input bg-background text-center text-lg font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            value={formData.roof_panels_count}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 10) update("roof_panels_count", v);
            }}
            min={1}
            max={10}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={formData.roof_panels_count >= 10}
            onClick={() =>
              update("roof_panels_count", formData.roof_panels_count + 1)
            }
          >
            +
          </Button>
        </div>
      </div>

      {/* Charpente */}
      <div className="space-y-2 rounded-lg border p-4">
        <Toggle
          label="Charpente à refaire ?"
          value={formData.needs_framework}
          onChange={(v) => update("needs_framework", v)}
        />
        {activePrice && (
          <p className="text-xs text-muted-foreground">
            Prix appliqué : {activePrice.label} —{" "}
            {formatCurrency(activePrice.price_per_m2)} / m²
          </p>
        )}
      </div>

      {/* Superficie */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          Superficie (m²)
        </label>
        <Input
          type="number"
          inputMode="decimal"
          min={1}
          className="text-lg font-semibold"
          value={formData.surface_m2 || ""}
          onFocus={(e) => e.target.select()}
          onChange={(e) => update("surface_m2", Number(e.target.value))}
          placeholder="Ex : 80"
        />
        <p className="text-xs text-muted-foreground">
          Surface totale de toiture à couvrir
        </p>
      </div>

      {/* Produits complémentaires */}
      {complementaryProducts.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Produits complémentaires
          </label>
          <div className="space-y-2">
            {complementaryProducts.map((product) => {
              const qty = getProductQuantity(product.id);
              return (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                    qty > 0 && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(product.unit_price_sell)} /{" "}
                      {product.unit_label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={qty <= 0}
                      onClick={() =>
                        updateProductQuantity(product.id, qty - 1)
                      }
                    >
                      −
                    </Button>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="w-10 rounded-md border border-input bg-background text-center text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                      value={qty}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 0) updateProductQuantity(product.id, v);
                      }}
                      min={0}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateProductQuantity(product.id, qty + 1)
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
