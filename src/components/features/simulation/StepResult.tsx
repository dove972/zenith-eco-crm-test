"use client";

import { useState, useMemo } from "react";
import type { SimulationResult } from "@/lib/calculations/simulationEngine";
import { calculateMonthlyPayment } from "@/lib/calculations/simulationEngine";
import type { CreditRate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Save,
  Loader2,
  CreditCard,
  Gift,
  Plus,
  Trash2,
} from "lucide-react";

interface PaymentEntry {
  label: string;
  amount: number;
}

interface StepResultProps {
  result: SimulationResult;
  creditRates: CreditRate[];
  onBack: () => void;
  onSave: (financing: {
    payment_mode: string;
    report_type: "30j" | "90j";
    financing_months: number;
    deposit_amount: number;
    payments?: PaymentEntry[];
    with_primes?: boolean;
  }) => void;
  saving: boolean;
}

const PAYMENT_MODES = [
  { value: "comptant", label: "Comptant" },
  { value: "multipaiement", label: "Multi-paiement" },
  { value: "financement", label: "Financement" },
  { value: "cheque", label: "Chèque" },
  { value: "especes", label: "Espèces" },
] as const;

const DURATION_OPTIONS = [
  10, 12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180,
] as const;

export default function StepResult({
  result,
  creditRates,
  onBack,
  onSave,
  saving,
}: StepResultProps) {
  const [paymentMode, setPaymentMode] = useState("financement");
  const [reportType, setReportType] = useState<"30j" | "90j">("90j");
  const [financingMonths, setFinancingMonths] = useState(180);
  const [depositAmount, setDepositAmount] = useState(0);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [withPrimes, setWithPrimes] = useState(false);

  const primes = [
    { label: "CEE BAR-EN-106", amount: result.prime_cee_106 },
    { label: "CEE BAR-EN-109", amount: result.prime_cee_109 },
    { label: "MPR BAR-EN-106", amount: result.prime_mpr_106 },
    { label: "MPR BAR-EN-109", amount: result.prime_mpr_109 },
  ].filter((p) => p.amount > 0);

  const totalPrimes = primes.reduce((s, p) => s + p.amount, 0);

  const displayedTotal = withPrimes
    ? Math.max(0, result.total_ttc - totalPrimes)
    : result.total_ttc;

  const amountToFinance = Math.max(0, displayedTotal - depositAmount);

  const financing = useMemo(() => {
    if (paymentMode !== "financement" || amountToFinance <= 0) return null;
    return calculateMonthlyPayment(
      amountToFinance,
      reportType,
      financingMonths,
      creditRates
    );
  }, [paymentMode, amountToFinance, reportType, financingMonths, creditRates]);

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const multiResteACharge = Math.max(0, displayedTotal - totalPaid);

  function addPaymentRow() {
    setPayments((prev) => [
      ...prev,
      { label: `Paiement ${prev.length + 1}`, amount: 0 },
    ]);
  }

  function removePaymentRow(index: number) {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePayment(
    index: number,
    field: keyof PaymentEntry,
    value: string | number
  ) {
    setPayments((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]: field === "amount" ? Number(value) || 0 : value,
            }
          : p
      )
    );
  }

  function handleSave() {
    onSave({
      payment_mode: paymentMode,
      report_type: reportType,
      financing_months: financingMonths,
      deposit_amount: depositAmount,
      payments: paymentMode === "multipaiement" ? payments : undefined,
      with_primes: withPrimes,
    });
  }

  return (
    <div className="space-y-5">
      {/* HERO : MENSUALITÉ ou MONTANT selon le mode */}
      {paymentMode === "financement" &&
        financing &&
        financing.monthly_payment > 0 ? (
          <div
            className="rounded-[18px] p-6 text-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, #464646, #2A2A2A 50%, #3A3A3A)",
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-[#FA7800] -translate-y-1/2 translate-x-1/2" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
              Votre mensualité
            </p>
            <p className="text-[3.2rem] font-extrabold text-[#FA7800] leading-none tracking-tight">
              {formatCurrency(financing.monthly_payment)}
            </p>
            <p className="text-[11px] text-white/30 mt-2 font-medium">
              par mois sur {financingMonths} mois
              {depositAmount > 0 && ` (acompte ${formatCurrency(depositAmount)})`}
            </p>
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-[11px] text-white/25">
                Montant {withPrimes ? "après primes" : "total"} :{" "}
                <span className="text-white/50 font-semibold">
                  {formatCurrency(displayedTotal)}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-[18px] p-6 text-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, #464646, #2A2A2A 50%, #3A3A3A)",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
              Montant à régler
            </p>
            <p className="text-[2.8rem] font-extrabold text-[#FA7800] leading-none tracking-tight">
              {formatCurrency(displayedTotal)}
            </p>
            <p className="text-[11px] text-white/30 mt-2 font-medium">TTC</p>
          </div>
        )}

      {/* TOGGLE AVEC/SANS PRIMES */}
      {totalPrimes > 0 && (
        <div className="rounded-[14px] bg-white shadow-card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-[#43A047]" />
              <p className="text-sm font-bold text-[#464646]">
                Aides éligibles
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-[#F5F5F5] p-0.5">
              <button
                type="button"
                onClick={() => setWithPrimes(false)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-bold transition-all",
                  !withPrimes
                    ? "bg-[#FA7800] text-white shadow-sm"
                    : "text-[#888] hover:text-[#464646]"
                )}
              >
                Sans primes
              </button>
              <button
                type="button"
                onClick={() => setWithPrimes(true)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-bold transition-all",
                  withPrimes
                    ? "bg-[#43A047] text-white shadow-sm"
                    : "text-[#888] hover:text-[#464646]"
                )}
              >
                Avec primes
              </button>
            </div>
          </div>
          <div className="px-5 pb-4 space-y-2">
            {withPrimes && (
              <p className="text-[11px] text-[#43A047] font-medium">
                Les primes sont déduites du montant affiché
              </p>
            )}
            {!withPrimes && (
              <p className="text-[11px] text-[#aaa]">
                Primes versées après travaux, non déduites du montant
              </p>
            )}
            {primes.map((prime) => (
              <div
                key={prime.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[#888]">{prime.label}</span>
                <span className="font-semibold text-[#43A047]">
                  {formatCurrency(prime.amount)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm border-t border-[#F5F5F5] pt-2">
              <span className="font-bold text-[#464646]">
                Total des aides
              </span>
              <span className="font-extrabold text-[#43A047]">
                {formatCurrency(totalPrimes)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DÉTAIL HT / TTC + Remise */}
      <div className="rounded-[14px] bg-white shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F5F5F5]">
          <p className="text-sm font-bold text-[#464646]">Détail financier</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#888]">Total HT</span>
            <span className="font-bold text-[#464646]">
              {formatCurrency(result.total_ht)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#888]">TVA</span>
            <span className="font-bold text-[#464646]">
              {formatCurrency(result.total_tva)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-[#F5F5F5] pt-3">
            <span className="text-[#464646] font-bold">Total TTC</span>
            <span className="font-extrabold text-[#464646]">
              {formatCurrency(result.total_ttc)}
            </span>
          </div>

          {result.remise_zenith_eco > 0 && (
            <div className="flex items-center justify-between text-sm border-t border-[#F5F5F5] pt-3">
              <span className="text-[#888]">
                Dont Remise ZENITH ECO incluse
              </span>
              <span className="font-semibold text-[#43A047]">
                −{formatCurrency(result.remise_zenith_eco)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* FINANCEMENT */}
      <div className="rounded-[14px] bg-white shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F5F5F5] flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#FA7800]" />
          <p className="text-sm font-bold text-[#464646]">Financement</p>
        </div>
        <div className="p-5 space-y-5">
          <div className="space-y-2">
            <p className="text-[13px] font-bold text-[#464646]">
              Mode de règlement
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setPaymentMode(mode.value)}
                  className={cn(
                    "rounded-[10px] border px-3 py-2.5 text-[13px] font-semibold transition-all",
                    paymentMode === mode.value
                      ? "border-[#FA7800] bg-[#FA7800]/8 text-[#FA7800]"
                      : "border-[#E0E0E0] bg-white text-[#888] hover:border-[#FA7800]"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMode === "multipaiement" && (
            <div className="space-y-4 border-t border-[#F5F5F5] pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#464646]">
                  Échéancier de paiement
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPaymentRow}
                  className="h-8 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter
                </Button>
              </div>

              {payments.length === 0 && (
                <p className="text-center text-xs text-[#ccc] py-4">
                  Ajoutez des paiements pour calculer le reste à charge
                </p>
              )}

              {payments.map((payment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    className="flex-1 text-sm"
                    value={payment.label}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updatePayment(index, "label", e.target.value)
                    }
                    placeholder="Libellé"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    className="w-28 text-right text-sm font-semibold"
                    value={payment.amount || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updatePayment(index, "amount", e.target.value)
                    }
                    placeholder="0 €"
                    min={0}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => removePaymentRow(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {payments.length > 0 && (
                <div
                  className="rounded-[14px] p-4"
                  style={{
                    background:
                      "linear-gradient(160deg, #464646, #3A3A3A 50%, #505050)",
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Total payé</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                    <span className="text-xs font-bold uppercase tracking-[0.1em] text-white/50">
                      Reste à charge
                    </span>
                    <span className="text-[1.6rem] font-extrabold text-[#FA7800] leading-none font-heading">
                      {formatCurrency(multiResteACharge)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentMode === "financement" && (
            <div className="space-y-4 border-t border-[#F5F5F5] pt-4">
              <div className="space-y-2">
                <p className="text-[13px] font-bold text-[#464646]">Report</p>
                <div className="flex gap-2">
                  {(["30j", "90j"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReportType(type)}
                      className={cn(
                        "flex-1 rounded-[10px] border px-4 py-2.5 text-sm font-semibold transition-all",
                        reportType === type
                          ? "border-[#FA7800] bg-[#FA7800] text-white"
                          : "border-[#E0E0E0] bg-white text-[#888] hover:border-[#FA7800]"
                      )}
                    >
                      {type === "30j" ? "30 jours" : "90 jours"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-bold text-[#464646]">
                  Durée :{" "}
                  <span className="text-[#FA7800]">
                    {financingMonths} mois
                  </span>
                </p>
                <select
                  value={financingMonths}
                  onChange={(e) =>
                    setFinancingMonths(Number(e.target.value))
                  }
                  className="flex h-11 w-full rounded-[10px] border border-[#E0E0E0] bg-white px-4 py-2 text-sm text-[#333] focus:border-[#FA7800] focus:outline-none focus:ring-2 focus:ring-[#FA7800]/15"
                >
                  {DURATION_OPTIONS.map((months) => (
                    <option key={months} value={months}>
                      {months} mois ({Math.floor(months / 12)} ans
                      {months % 12 > 0 ? ` ${months % 12} mois` : ""})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="deposit"
                  className="text-[13px] font-bold text-[#464646]"
                >
                  Montant acompte
                </label>
                <Input
                  id="deposit"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={displayedTotal}
                  step={100}
                  value={depositAmount || ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setDepositAmount(
                      Math.min(
                        Number(e.target.value) || 0,
                        displayedTotal
                      )
                    )
                  }
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={saving}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
