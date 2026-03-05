"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  calculateSimulation,
  type BaremeData,
  type SimulationResult,
} from "@/lib/calculations/simulationEngine";
import type { ComplementaryProduct } from "@/types";
import { Loader2 } from "lucide-react";
import { useSimulationBasePath } from "@/hooks/use-simulation-paths";

import StepClient from "@/components/features/simulation/StepClient";
import StepEligibility from "@/components/features/simulation/StepEligibility";
import StepProject from "@/components/features/simulation/StepProject";
import StepResult from "@/components/features/simulation/StepResult";

interface WizardData {
  client: {
    first_name: string;
    last_name: string;
    email?: string;
    address: string;
    postal_code: string;
    city: string;
    phone: string;
    comments?: string;
  };
  eligibility: {
    is_owner: boolean;
    is_primary_residence: boolean;
    house_over_2_years: boolean;
    tax_persons_count: number;
    tax_reference_income: number;
    mpr_account_amount: number;
    already_isolated_106: boolean;
    already_isolated_109: boolean;
  };
  project: {
    sheet_type: "acier" | "alu";
    roof_panels_count: number;
    needs_framework: boolean;
    surface_m2: number;
    products: Array<{ product_id: string; quantity: number }>;
  };
}

const INITIAL_DATA: WizardData = {
  client: {
    first_name: "",
    last_name: "",
    address: "",
    postal_code: "",
    city: "",
    phone: "",
  },
  eligibility: {
    is_owner: true,
    is_primary_residence: true,
    house_over_2_years: true,
    tax_persons_count: 1,
    tax_reference_income: 0,
    mpr_account_amount: 0,
    already_isolated_106: false,
    already_isolated_109: false,
  },
  project: {
    sheet_type: "acier",
    roof_panels_count: 1,
    needs_framework: false,
    surface_m2: 0,
    products: [],
  },
};

const STEPS = [
  { label: "Client" },
  { label: "Éligibilité" },
  { label: "Chantier" },
  { label: "Résultat" },
];

export default function NewSimulationPage() {
  const router = useRouter();
  const basePath = useSimulationBasePath();
  const { profile, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(INITIAL_DATA);
  const [baremes, setBaremes] = useState<BaremeData | null>(null);
  const [products, setProducts] = useState<ComplementaryProduct[]>([]);
  const [loadingBaremes, setLoadingBaremes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [financingData, setFinancingData] = useState<{
    payment_mode: string;
    report_type: "30j" | "90j";
    financing_months: number;
    deposit_amount: number;
  } | null>(null);

  useEffect(() => {
    async function loadBaremes() {
      const supabase = createClient();

      const [
        { data: salePrices },
        { data: mprThresholds },
        { data: mprRates },
        { data: ceeRates },
        { data: creditRates },
        { data: complementaryProducts },
      ] = await Promise.all([
        supabase.from("sale_prices").select("*"),
        supabase.from("mpr_thresholds").select("*"),
        supabase.from("mpr_rates").select("*"),
        supabase.from("cee_rates").select("*"),
        supabase.from("credit_rates").select("*"),
        supabase.from("complementary_products").select("*").eq("active", true),
      ]);

      setBaremes({
        sale_prices: salePrices ?? [],
        mpr_thresholds: mprThresholds ?? [],
        mpr_rates: mprRates ?? [],
        cee_rates: ceeRates ?? [],
        credit_rates: creditRates ?? [],
      });
      setProducts((complementaryProducts as ComplementaryProduct[]) ?? []);
      setLoadingBaremes(false);
    }

    loadBaremes();
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleClientNext = useCallback((data: WizardData["client"]) => {
    setWizardData((prev) => ({ ...prev, client: data }));
    setStep(2);
    scrollToTop();
  }, [scrollToTop]);

  const handleEligibilityNext = useCallback(
    (data: WizardData["eligibility"]) => {
      setWizardData((prev) => ({ ...prev, eligibility: data }));
      setStep(3);
      scrollToTop();
    },
    [scrollToTop]
  );

  const handleProjectNext = useCallback((data: WizardData["project"]) => {
    setWizardData((prev) => ({ ...prev, project: data }));
    setStep(4);
    scrollToTop();
  }, [scrollToTop]);

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1));
    scrollToTop();
  }, [scrollToTop]);

  const computeResult = useCallback((): SimulationResult | null => {
    if (!baremes) return null;
    const selectedProducts = wizardData.project.products
      .filter((p) => p.quantity > 0)
      .map((p) => {
        const product = products.find((prod) => prod.id === p.product_id);
        return {
          quantity: p.quantity,
          unit_price_sell: product?.unit_price_sell ?? 0,
          tva_rate: product?.tva_rate ?? 0,
        };
      });

    return calculateSimulation(
      {
        sheet_type: wizardData.project.sheet_type,
        needs_framework: wizardData.project.needs_framework,
        surface_m2: wizardData.project.surface_m2,
        eligibility: {
          is_owner: wizardData.eligibility.is_owner,
          is_primary_residence: wizardData.eligibility.is_primary_residence,
          house_over_2_years: wizardData.eligibility.house_over_2_years,
          already_isolated_106: wizardData.eligibility.already_isolated_106,
          already_isolated_109: wizardData.eligibility.already_isolated_109,
        },
        tax_persons_count: wizardData.eligibility.tax_persons_count,
        tax_reference_income: wizardData.eligibility.tax_reference_income,
        mpr_account_amount: wizardData.eligibility.mpr_account_amount,
        complementary_products: selectedProducts,
      },
      baremes
    );
  }, [baremes, wizardData, products]);

  const handleSave = useCallback(
    async (financing: {
      payment_mode: string;
      report_type: "30j" | "90j";
      financing_months: number;
      deposit_amount: number;
      payments?: Array<{ label: string; amount: number }>;
    }) => {
    if (!profile || !baremes || saving) return;

    setFinancingData(financing);
    setSaving(true);
    try {
      const supabase = createClient();
      const result = computeResult();
      if (!result) throw new Error("Calculation failed");

      // Insert client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: wizardData.client.first_name,
          last_name: wizardData.client.last_name,
          email: wizardData.client.email || null,
          address: wizardData.client.address,
          postal_code: wizardData.client.postal_code,
          city: wizardData.client.city,
          phone: wizardData.client.phone,
          comments: wizardData.client.comments ?? "",
          is_owner: wizardData.eligibility.is_owner,
          is_primary_residence: wizardData.eligibility.is_primary_residence,
          house_over_2_years: wizardData.eligibility.house_over_2_years,
          tax_persons_count: wizardData.eligibility.tax_persons_count,
          tax_reference_income: wizardData.eligibility.tax_reference_income,
          mpr_client_type: result.mpr_client_type,
          mpr_account_amount: wizardData.eligibility.mpr_account_amount,
          commercial_id: profile.id,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;

      const { data: simulation, error: simError } = await supabase
        .from("simulations")
        .insert({
          client_id: client.id,
          commercial_id: profile.id,
          sheet_type: wizardData.project.sheet_type,
          roof_panels_count: wizardData.project.roof_panels_count,
          needs_framework: wizardData.project.needs_framework,
          already_isolated_106: wizardData.eligibility.already_isolated_106,
          already_isolated_109: wizardData.eligibility.already_isolated_109,
          surface_m2: wizardData.project.surface_m2,
          total_ht: result.total_ht,
          total_tva: result.total_tva,
          total_ttc: result.total_ttc,
          remise_zenith_eco: result.remise_zenith_eco,
          prime_cee_106: result.prime_cee_106,
          prime_cee_109: result.prime_cee_109,
          prime_mpr_106: result.prime_mpr_106,
          prime_mpr_109: result.prime_mpr_109,
          reste_a_charge: result.reste_a_charge,
          status: "brouillon",
        })
        .select("id")
        .single();

      if (simError) throw simError;

      const productInserts = wizardData.project.products
        .filter((p) => p.quantity > 0)
        .map((p) => {
          const product = products.find((prod) => prod.id === p.product_id);
          return {
            simulation_id: simulation.id,
            product_id: p.product_id,
            quantity: p.quantity,
            unit_price: product?.unit_price_sell ?? 0,
            total_price: (product?.unit_price_sell ?? 0) * p.quantity,
          };
        });

      if (productInserts.length > 0) {
        const { error: productsError } = await supabase
          .from("simulation_products")
          .insert(productInserts);

        if (productsError) throw productsError;
      }

      router.push(`${basePath}/${simulation.id}`);
    } catch (error: unknown) {
      console.error("Erreur lors de la sauvegarde:", error);
      let msg = "Erreur inconnue";
      if (error instanceof Error) {
        msg = error.message;
      } else if (error && typeof error === "object" && "message" in error) {
        const e = error as { message: string; code?: string; details?: string };
        msg = `${e.message}${e.code ? ` (code: ${e.code})` : ""}${e.details ? ` — ${e.details}` : ""}`;
      }
      alert("Erreur lors de la sauvegarde :\n" + msg);
    } finally {
      setSaving(false);
    }
  }, [profile, baremes, saving, wizardData, products, router, computeResult, basePath]);

  if (authLoading || loadingBaremes) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FA7800]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <h1 className="text-[1.3rem] font-extrabold text-[#464646]">
        Nouvelle simulation
      </h1>

      {/* Progress bar */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => {
          const stepNumber = i + 1;
          const isCompleted = step > stepNumber;
          const isCurrent = step === stepNumber;

          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                        ? "bg-[#43A047] text-white"
                      : isCurrent
                        ? "bg-[#FA7800] text-white ring-4 ring-[#FA7800]/15"
                        : "bg-[#F5F5F5] text-[#888]"
                  }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    isCurrent
                      ? "text-[#FA7800]"
                      : isCompleted
                        ? "text-[#43A047]"
                        : "text-[#888]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1.5 h-[3px] flex-1 rounded-full transition-colors ${
                    isCompleted ? "bg-[#43A047]" : "bg-[#F5F5F5]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 1 && (
        <StepClient data={wizardData.client} onNext={handleClientNext} />
      )}
      {step === 2 && baremes && (
        <StepEligibility
          data={wizardData.eligibility}
          mprThresholds={baremes.mpr_thresholds}
          onNext={handleEligibilityNext}
          onBack={handleBack}
        />
      )}
      {step === 3 && baremes && (
        <StepProject
          data={wizardData.project}
          salePrices={baremes.sale_prices}
          complementaryProducts={products}
          onNext={handleProjectNext}
          onBack={handleBack}
        />
      )}
      {step === 4 && baremes && (() => {
        const result = computeResult();
        if (!result) return null;
        return (
          <StepResult
            result={result}
            creditRates={baremes.credit_rates}
            onBack={handleBack}
            onSave={handleSave}
            saving={saving}
          />
        );
      })()}
    </div>
  );
}
