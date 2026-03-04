"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  calculateSimulation,
  type BaremeData,
  type SimulationResult,
} from "@/lib/calculations/simulationEngine";
import type { ComplementaryProduct, Simulation, Devis, Client } from "@/types";
import { Loader2 } from "lucide-react";
import { useSimulationBasePath } from "@/hooks/use-simulation-paths";
import { toast } from "sonner";

import StepClient from "@/components/features/simulation/StepClient";
import StepEligibility from "@/components/features/simulation/StepEligibility";
import StepProject from "@/components/features/simulation/StepProject";
import StepResult from "@/components/features/simulation/StepResult";

interface WizardData {
  client: {
    first_name: string;
    last_name: string;
    address: string;
    postal_code: string;
    city: string;
    phone: string;
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

const STEPS = [
  { label: "Client" },
  { label: "Éligibilité" },
  { label: "Chantier" },
  { label: "Résultat" },
];

export default function EditDevisPage() {
  const params = useParams();
  const router = useRouter();
  const simulationId = params.id as string;
  const basePath = useSimulationBasePath();
  const { profile, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [baremes, setBaremes] = useState<BaremeData | null>(null);
  const [products, setProducts] = useState<ComplementaryProduct[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [existingSimulation, setExistingSimulation] =
    useState<Simulation | null>(null);
  const [existingDevis, setExistingDevis] = useState<Devis | null>(null);
  const [existingClient, setExistingClient] = useState<Client | null>(null);

  useEffect(() => {
    async function loadAll() {
      const supabase = createClient();

      const [
        { data: simData },
        { data: devisData },
        { data: simProducts },
        { data: salePrices },
        { data: mprThresholds },
        { data: mprRates },
        { data: ceeRates },
        { data: creditRates },
        { data: complementaryProducts },
      ] = await Promise.all([
        supabase
          .from("simulations")
          .select("*, client:clients(*)")
          .eq("id", simulationId)
          .single(),
        supabase
          .from("devis")
          .select("*")
          .eq("simulation_id", simulationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("simulation_products")
          .select("*")
          .eq("simulation_id", simulationId),
        supabase.from("sale_prices").select("*"),
        supabase.from("mpr_thresholds").select("*"),
        supabase.from("mpr_rates").select("*"),
        supabase.from("cee_rates").select("*"),
        supabase.from("credit_rates").select("*"),
        supabase
          .from("complementary_products")
          .select("*")
          .eq("active", true),
      ]);

      if (!simData) {
        toast.error("Simulation introuvable");
        router.push(basePath);
        return;
      }

      const sim = simData as Simulation;
      const client = sim.client as Client;
      const devis = devisData as Devis | null;

      setExistingSimulation(sim);
      setExistingClient(client);
      if (devis) setExistingDevis(devis);

      setBaremes({
        sale_prices: salePrices ?? [],
        mpr_thresholds: mprThresholds ?? [],
        mpr_rates: mprRates ?? [],
        cee_rates: ceeRates ?? [],
        credit_rates: creditRates ?? [],
      });
      setProducts((complementaryProducts as ComplementaryProduct[]) ?? []);

      const existingProducts = (simProducts ?? []).map(
        (sp: { product_id: string; quantity: number }) => ({
          product_id: sp.product_id,
          quantity: sp.quantity,
        })
      );

      setWizardData({
        client: {
          first_name: client.first_name,
          last_name: client.last_name,
          address: client.address,
          postal_code: client.postal_code,
          city: client.city,
          phone: client.phone,
        },
        eligibility: {
          is_owner: client.is_owner,
          is_primary_residence: client.is_primary_residence,
          house_over_2_years: client.house_over_2_years,
          tax_persons_count: client.tax_persons_count,
          tax_reference_income: client.tax_reference_income,
          mpr_account_amount: client.mpr_account_amount,
          already_isolated_106: sim.already_isolated_106,
          already_isolated_109: sim.already_isolated_109,
        },
        project: {
          sheet_type: sim.sheet_type,
          roof_panels_count: sim.roof_panels_count,
          needs_framework: sim.needs_framework,
          surface_m2: sim.surface_m2,
          products: existingProducts,
        },
      });

      setLoadingData(false);
    }

    loadAll();
  }, [simulationId, router, basePath]);

  const handleClientNext = useCallback(
    (data: WizardData["client"]) => {
      setWizardData((prev) => (prev ? { ...prev, client: data } : prev));
      setStep(2);
    },
    []
  );

  const handleEligibilityNext = useCallback(
    (data: WizardData["eligibility"]) => {
      setWizardData((prev) =>
        prev ? { ...prev, eligibility: data } : prev
      );
      setStep(3);
    },
    []
  );

  const handleProjectNext = useCallback(
    (data: WizardData["project"]) => {
      setWizardData((prev) => (prev ? { ...prev, project: data } : prev));
      setStep(4);
    },
    []
  );

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1));
  }, []);

  const computeResult = useCallback((): SimulationResult | null => {
    if (!baremes || !wizardData) return null;
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
      if (
        !profile ||
        !baremes ||
        !wizardData ||
        !existingSimulation ||
        !existingClient ||
        saving
      )
        return;

      setSaving(true);
      try {
        const supabase = createClient();
        const result = computeResult();
        if (!result) throw new Error("Calculation failed");

        const { error: clientError } = await supabase
          .from("clients")
          .update({
            first_name: wizardData.client.first_name,
            last_name: wizardData.client.last_name,
            address: wizardData.client.address,
            postal_code: wizardData.client.postal_code,
            city: wizardData.client.city,
            phone: wizardData.client.phone,
            is_owner: wizardData.eligibility.is_owner,
            is_primary_residence:
              wizardData.eligibility.is_primary_residence,
            house_over_2_years:
              wizardData.eligibility.house_over_2_years,
            tax_persons_count: wizardData.eligibility.tax_persons_count,
            tax_reference_income:
              wizardData.eligibility.tax_reference_income,
            mpr_client_type: result.mpr_client_type,
            mpr_account_amount:
              wizardData.eligibility.mpr_account_amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingClient.id);

        if (clientError) throw clientError;

        const { error: simError } = await supabase
          .from("simulations")
          .update({
            sheet_type: wizardData.project.sheet_type,
            roof_panels_count: wizardData.project.roof_panels_count,
            needs_framework: wizardData.project.needs_framework,
            already_isolated_106:
              wizardData.eligibility.already_isolated_106,
            already_isolated_109:
              wizardData.eligibility.already_isolated_109,
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
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSimulation.id);

        if (simError) throw simError;

        await supabase
          .from("simulation_products")
          .delete()
          .eq("simulation_id", existingSimulation.id);

        const productInserts = wizardData.project.products
          .filter((p) => p.quantity > 0)
          .map((p) => {
            const product = products.find(
              (prod) => prod.id === p.product_id
            );
            return {
              simulation_id: existingSimulation.id,
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

        if (existingDevis) {
          const { calculateMonthlyPayment } = await import(
            "@/lib/calculations/simulationEngine"
          );
          const creditRates = baremes.credit_rates;
          const amountToFinance = Math.max(
            0,
            result.total_ttc - financing.deposit_amount
          );
          const fin =
            financing.payment_mode === "financement" &&
            amountToFinance > 0
              ? calculateMonthlyPayment(
                  amountToFinance,
                  financing.report_type,
                  financing.financing_months,
                  creditRates
                )
              : null;

          const { error: devisError } = await supabase
            .from("devis")
            .update({
              payment_mode: financing.payment_mode,
              payment_schedule:
                financing.payment_mode === "multipaiement"
                  ? financing.payments ?? []
                  : [],
              report_type:
                financing.payment_mode === "financement"
                  ? financing.report_type
                  : null,
              financing_months:
                financing.payment_mode === "financement"
                  ? financing.financing_months
                  : null,
              deposit_amount:
                financing.payment_mode === "financement"
                  ? financing.deposit_amount
                  : 0,
              monthly_payment: fin ? fin.monthly_payment : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingDevis.id);

          if (devisError) throw devisError;
        }

        toast.success("Devis modifié avec succès");
        router.push(`${basePath}/${existingSimulation.id}/devis`);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        toast.error("Erreur lors de la modification");
        setSaving(false);
      }
    },
    [
      profile,
      baremes,
      wizardData,
      existingSimulation,
      existingClient,
      existingDevis,
      saving,
      products,
      router,
      computeResult,
      basePath,
    ]
  );

  if (authLoading || loadingData || !wizardData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FA7800]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <h1 className="text-[1.3rem] font-extrabold text-[#464646]">
        Modifier le devis
        {existingDevis && (
          <span className="ml-2 text-sm font-medium text-[#FA7800]">
            {existingDevis.devis_number}
          </span>
        )}
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
      {step === 4 &&
        baremes &&
        (() => {
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
