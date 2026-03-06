"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DEVIS_STATUS_LABELS, PAYMENT_MODE_LABELS } from "@/types";
import type { Simulation, Devis, CreditRate, SimulationProduct } from "@/types";
import { calculateMonthlyPayment } from "@/lib/calculations/simulationEngine";
import {
  ArrowLeft,
  Download,
  Send,
  Check,
  X,
  Share2,
  Loader2,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useSimulationBasePath } from "@/hooks/use-simulation-paths";
import { useAuth } from "@/hooks/use-auth";

interface ScheduleRow {
  label: string;
  percentage: number;
}

const DEFAULT_SCHEDULE: ScheduleRow[] = [
  { label: "Acompte", percentage: 30 },
  { label: "Mi-chantier", percentage: 40 },
  { label: "Fin de chantier", percentage: 30 },
];

const PAYMENT_MODES = [
  { value: "credit_moderne", label: "Crédit Moderne" },
  { value: "fonds_propres_banque", label: "Fonds propres (Banque)" },
  { value: "fonds_propres_cheque", label: "Fonds propres (Chèque)" },
  { value: "virement", label: "Virement" },
];

const FINANCING_DURATIONS = [
  10, 12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180,
];

function getStatusColor(status: string) {
  switch (status) {
    case "brouillon":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "envoye":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "accepte":
      return "bg-green-100 text-green-800 border-green-200";
    case "refuse":
      return "bg-red-100 text-red-800 border-red-200";
    case "expire":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function DevisPage() {
  const params = useParams();
  const simulationId = params.id as string;
  const basePath = useSimulationBasePath();
  const { profile } = useAuth();

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [devis, setDevis] = useState<Devis | null>(null);
  const [creditRates, setCreditRates] = useState<CreditRate[]>([]);
  const [simProducts, setSimProducts] = useState<SimulationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [paymentMode, setPaymentMode] = useState("credit_moderne");
  const [schedule, setSchedule] = useState<ScheduleRow[]>(DEFAULT_SCHEDULE);
  const [reportType, setReportType] = useState<"30j" | "90j">("90j");
  const [financingMonths, setFinancingMonths] = useState(180);
  const [depositAmount, setDepositAmount] = useState(0);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [{ data: simData }, { data: devisData }, { data: rates }, { data: productsData }] =
      await Promise.all([
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
        supabase.from("credit_rates").select("*").order("months"),
        supabase
          .from("simulation_products")
          .select("*, product:complementary_products(*)")
          .eq("simulation_id", simulationId),
      ]);

    if (simData) setSimulation(simData as Simulation);
    setCreditRates((rates as CreditRate[]) ?? []);
    setSimProducts((productsData as SimulationProduct[]) ?? []);

    if (devisData) {
      const d = devisData as Devis;
      setDevis(d);
      setPaymentMode(d.payment_mode ?? "credit_moderne");
      setReportType(d.report_type ?? "90j");
      setFinancingMonths(d.financing_months ?? 180);
      setDepositAmount(d.deposit_amount ?? 0);
      if (
        (d.payment_mode === "multipaiement" || d.payment_mode === "fonds_propres_cheque") &&
        Array.isArray(d.payment_schedule) &&
        d.payment_schedule.length > 0
      ) {
        setSchedule(d.payment_schedule as ScheduleRow[]);
      }
    }

    setLoading(false);
  }, [simulationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const amountToFinance = simulation
    ? Math.max(0, simulation.reste_a_charge - depositAmount)
    : 0;

  const financing = useMemo(() => {
    if (paymentMode !== "credit_moderne" || amountToFinance <= 0) return null;
    return calculateMonthlyPayment(
      amountToFinance,
      reportType,
      financingMonths,
      creditRates
    );
  }, [paymentMode, amountToFinance, reportType, financingMonths, creditRates]);

  async function handleCreateDevis() {
    if (!simulation) return;
    setSubmitting(true);

    try {
      const supabase = createClient();

      const { data: devisNumber, error: rpcError } = await supabase.rpc(
        "generate_devis_number"
      );

      if (rpcError || !devisNumber) {
        console.error("Erreur RPC devis_number:", rpcError);
        toast.error(`Erreur génération numéro de devis : ${rpcError?.message ?? "Numéro vide"}`);
        setSubmitting(false);
        return;
      }

      const { data: newDevis, error } = await supabase
        .from("devis")
        .insert({
          simulation_id: simulationId,
          devis_number: devisNumber,
          status: "brouillon",
          payment_mode: paymentMode,
          payment_schedule:
            paymentMode === "fonds_propres_cheque" ? schedule : [],
          report_type: paymentMode === "credit_moderne" ? reportType : null,
          financing_months:
            paymentMode === "credit_moderne" ? financingMonths : null,
          deposit_amount:
            paymentMode === "credit_moderne" ? depositAmount : 0,
          monthly_payment:
            paymentMode === "credit_moderne" && financing
              ? financing.monthly_payment
              : null,
          legal_mentions: "Devis valable 3 mois à compter de sa date d'émission.",
        })
        .select("*")
        .single();

      if (error) {
        console.error("Erreur création devis:", error);
        toast.error(`Erreur lors de la création du devis : ${error.message}`);
        return;
      }

      toast.success(`Devis ${devisNumber} créé`);
      setDevis(newDevis as Devis);
    } catch {
      toast.error("Erreur réseau, veuillez réessayer");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    if (!devis) return;
    setSubmitting(true);

    try {
      const supabase = createClient();

      const { data: updatedDevis, error } = await supabase
        .from("devis")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", devis.id)
        .select("*")
        .single();

      if (error) {
        toast.error("Erreur lors de la mise à jour du statut");
        return;
      }

      toast.success(
        `Statut mis à jour : ${DEVIS_STATUS_LABELS[newStatus] ?? newStatus}`
      );
      setDevis(updatedDevis as Devis);

      // Envoyer l'email au client quand le devis passe en "envoyé"
      if (newStatus === "envoye" && simulation?.client) {
        const clientEmail = simulation.client.email;
        if (clientEmail) {
          try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const commercialName = profile
              ? `${profile.first_name} ${profile.last_name}`
              : "ZENITH ECO";
            const commercialPhone = profile?.phone || "";

            const emailRes = await fetch("/api/email/send-devis", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                clientEmail,
                clientFirstName: simulation.client.first_name,
                clientLastName: simulation.client.last_name,
                devisNumber: devis.devis_number,
                montantTotal: simulation.total_ttc,
                commercialName,
                commercialPhone,
                description: `Devis pour toiture ${simulation.sheet_type.toUpperCase()} — ${simulation.surface_m2} m²`,
              }),
            });

            if (emailRes.ok) {
              toast.success("Email envoyé au client !");
            } else {
              toast.warning("Devis envoyé mais l'email n'a pas pu être envoyé");
            }
          } catch {
            toast.warning("Devis envoyé mais l'email n'a pas pu être envoyé");
          }
        } else {
          toast.info("Pas d'email client renseigné — devis mis à jour sans envoi");
        }
      }
    } catch {
      toast.error("Erreur réseau, veuillez réessayer");
    } finally {
      setSubmitting(false);
    }
  }

  function handleShareWhatsApp() {
    if (!devis || !simulation?.client) return;
    const client = simulation.client;
    const message = encodeURIComponent(
      `Bonjour ${client.first_name} ${client.last_name},\n\nVotre devis n°${devis.devis_number} est disponible.\n\nMontant : ${formatCurrency(simulation.reste_a_charge)}\n\nCordialement,\nZENITH ECO`
    );
    const phone = client.phone?.replace(/\s/g, "").replace(/^0/, "33");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  }

  async function handleSendEmail() {
    if (!devis || !simulation?.client) return;
    const client = simulation.client;
    if (!client.email) {
      toast.error("Le client n'a pas d'adresse email renseignée");
      return;
    }
    setSendingEmail(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }

      const pdfUrl = `${window.location.origin}/api/devis/${devis.id}/pdf`;

      const res = await fetch("/api/email/send-devis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientEmail: client.email,
          clientFirstName: client.first_name,
          clientLastName: client.last_name,
          devisNumber: devis.devis_number,
          montantTotal: formatCurrency(simulation.total_ttc),
          description: `Projet de toiture – ${simulation.sheet_type === "acier" ? "Bac acier" : "Bac aluminium"}`,
          pdfUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'envoi");
      } else {
        toast.success(`Devis envoyé à ${client.email}`);
        // Mettre le statut à "envoyé" automatiquement si brouillon
        if (devis.status === "brouillon") {
          await handleUpdateStatus("envoye");
        }
      }
    } catch (error) {
      console.error("Erreur envoi email:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setSendingEmail(false);
    }
  }

  function addScheduleRow() {
    setSchedule([...schedule, { label: "", percentage: 0 }]);
  }

  function removeScheduleRow(index: number) {
    setSchedule(schedule.filter((_, i) => i !== index));
  }

  function updateScheduleRow(
    index: number,
    field: keyof ScheduleRow,
    value: string | number
  ) {
    const updated = [...schedule];
    if (field === "label") {
      updated[index] = { ...updated[index], label: value as string };
    } else {
      updated[index] = { ...updated[index], percentage: Number(value) };
    }
    setSchedule(updated);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="space-y-4 p-4">
        <Link href={basePath}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Simulation introuvable
          </p>
        </div>
      </div>
    );
  }

  const totalSchedulePercent = schedule.reduce(
    (s, r) => s + r.percentage,
    0
  );

  // ---- VIEW MODE: devis exists ----
  if (devis) {
    const scheduleData = Array.isArray(devis.payment_schedule)
      ? (devis.payment_schedule as ScheduleRow[])
      : [];

    return (
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`${basePath}/${simulationId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Devis</h1>
            <p className="text-sm text-muted-foreground">
              {simulation.client
                ? `${simulation.client.first_name} ${simulation.client.last_name}`
                : "Client"}
            </p>
          </div>
          <Badge className={getStatusColor(devis.status)}>
            {DEVIS_STATUS_LABELS[devis.status] ?? devis.status}
          </Badge>
        </div>

        {/* Devis number */}
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Numéro de devis
              </p>
              <p className="text-2xl font-bold tracking-wider">
                {devis.devis_number}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contenu détaillé du devis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contenu du devis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {simulation.client && (
              <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Client
                </p>
                <p className="font-semibold">
                  {simulation.client.first_name} {simulation.client.last_name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {simulation.client.address}, {simulation.client.postal_code}{" "}
                  {simulation.client.city}
                </p>
                <p className="text-muted-foreground text-xs">
                  Tél : {simulation.client.phone}
                </p>
                {simulation.client.email && (
                  <p className="text-muted-foreground text-xs">
                    Email : {simulation.client.email}
                  </p>
                )}
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FA7800] text-white text-xs">
                    <th className="px-3 py-2 text-left font-medium">
                      Désignation
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Qté
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      PU HT
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      TVA
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Total HT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Ligne Toiture */}
                  {(() => {
                    const productsHT = simProducts.reduce((s, p) => {
                      const tvaRate = p.product?.tva_rate ?? 0;
                      return s + (p.unit_price * p.quantity) / (1 + tvaRate / 100);
                    }, 0);
                    const toitureHT = simulation.total_ht - productsHT;
                    const toiturePuHT = simulation.surface_m2 > 0
                      ? toitureHT / simulation.surface_m2
                      : 0;
                    return (
                      <tr className="border-b bg-[#FFF8F0]">
                        <td className="px-3 py-2 font-medium">
                          Toiture {simulation.sheet_type.toUpperCase()} —{" "}
                          {simulation.surface_m2} m²
                          {simulation.needs_framework && " + Charpente"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {simulation.surface_m2} m²
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(toiturePuHT)}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          2,1%
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(toitureHT)}
                        </td>
                      </tr>
                    );
                  })()}
                  {/* Produits complémentaires */}
                  {simProducts.map((sp) => {
                    const tvaRate = sp.product?.tva_rate ?? 0;
                    const totalHT = sp.total_price / (1 + tvaRate / 100);
                    const unitHT = sp.unit_price / (1 + tvaRate / 100);
                    return (
                      <tr key={sp.id} className="border-b">
                        <td className="px-3 py-2">
                          {sp.product?.name ?? "Produit"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {sp.quantity}{sp.product?.unit_label ? ` ${sp.product.unit_label}` : ""}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(unitHT)}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {tvaRate}%
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(totalHT)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">
                  {formatCurrency(simulation.total_ht)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium">
                  {formatCurrency(simulation.total_tva)}
                </span>
              </div>
              {simulation.remise_zenith_eco > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Remise ZENITH ECO
                  </span>
                  <span className="font-medium text-green-700">
                    −{formatCurrency(simulation.remise_zenith_eco)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Total TTC</span>
                <span className="text-lg font-bold text-[#FA7800]">
                  {formatCurrency(simulation.total_ttc)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Détails du paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Mode de règlement
              </span>
              <span className="font-medium">
                {PAYMENT_MODE_LABELS[devis.payment_mode] ??
                  devis.payment_mode}
              </span>
            </div>

            {(devis.payment_mode === "financement" || devis.payment_mode === "credit_moderne") && (
              <>
                {devis.report_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Report</span>
                    <span className="font-medium">
                      {devis.report_type === "30j"
                        ? "30 jours"
                        : "90 jours"}
                    </span>
                  </div>
                )}
                {devis.financing_months && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée</span>
                    <span className="font-medium">
                      {devis.financing_months} mois (
                      {Math.floor(devis.financing_months / 12)} ans
                      {devis.financing_months % 12 > 0
                        ? ` ${devis.financing_months % 12} mois`
                        : ""}
                      )
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acompte</span>
                  <span className="font-medium">
                    {formatCurrency(devis.deposit_amount)}
                  </span>
                </div>
                {devis.monthly_payment != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Mensualité
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(devis.monthly_payment)}/mois
                    </span>
                  </div>
                )}
              </>
            )}

            {(devis.payment_mode === "multipaiement" || devis.payment_mode === "fonds_propres_cheque") &&
              scheduleData.length > 0 && (
                <div className="space-y-1 border-t pt-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Échéancier
                  </p>
                  {scheduleData.map((row, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="font-medium">
                        {row.percentage}% —{" "}
                        {formatCurrency(
                          (simulation.reste_a_charge * row.percentage) /
                            100
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Montant à régler</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(simulation.total_ttc)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Primes (informationnel) */}
        {(simulation.prime_cee_106 > 0 ||
          simulation.prime_cee_109 > 0 ||
          simulation.prime_mpr_106 > 0 ||
          simulation.prime_mpr_109 > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700">
                Aides éligibles (à titre informatif)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-xs text-muted-foreground">
                Ces primes sont versées après travaux et ne sont pas
                déduites du montant à régler.
              </p>
              {simulation.prime_cee_106 > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    CEE BAR-EN-106
                  </span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(simulation.prime_cee_106)}
                  </span>
                </div>
              )}
              {simulation.prime_cee_109 > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    CEE BAR-EN-109
                  </span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(simulation.prime_cee_109)}
                  </span>
                </div>
              )}
              {simulation.prime_mpr_106 > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    MPR BAR-EN-106
                  </span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(simulation.prime_mpr_106)}
                  </span>
                </div>
              )}
              {simulation.prime_mpr_109 > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    MPR BAR-EN-109
                  </span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(simulation.prime_mpr_109)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-green-700">
                  Total des aides
                </span>
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(
                    simulation.prime_cee_106 +
                      simulation.prime_cee_109 +
                      simulation.prime_mpr_106 +
                      simulation.prime_mpr_109
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          {/* Modify button — opens full wizard editor */}
          <Link
            href={`${basePath}/${simulationId}/devis/edit`}
            className="col-span-2"
          >
            <Button variant="outline" className="w-full">
              <Pencil className="mr-2 h-4 w-4" />
              Modifier le devis
            </Button>
          </Link>

          <Link
            href={`/api/devis/${devis.id}/pdf`}
            className="col-span-2"
          >
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
          </Link>

          {devis.status === "brouillon" && (
            <Button
              onClick={() => handleUpdateStatus("envoye")}
              disabled={submitting}
              className="col-span-2"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Envoyer le devis
            </Button>
          )}

          <Button
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50"
            onClick={() => handleUpdateStatus("accepte")}
            disabled={submitting || devis.status === "accepte"}
          >
            <Check className="mr-2 h-4 w-4" />
            Accepté
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => handleUpdateStatus("refuse")}
            disabled={submitting || devis.status === "refuse"}
          >
            <X className="mr-2 h-4 w-4" />
            Refusé
          </Button>

          <Button
            variant="outline"
            onClick={handleShareWhatsApp}
            className="col-span-2"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Partager via WhatsApp
          </Button>

          <Button
            onClick={handleSendEmail}
            disabled={sendingEmail || !simulation?.client?.email}
            className="col-span-2 bg-[#FA7800] hover:bg-[#e06e00] text-white"
          >
            {sendingEmail ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {sendingEmail ? "Envoi en cours…" : "Envoyer par email"}
          </Button>
          {!simulation?.client?.email && (
            <p className="col-span-2 text-center text-xs text-muted-foreground">
              Aucun email renseigné pour ce client
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---- FORM MODE: create or edit ----
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`${basePath}/${simulationId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">
            Créer un devis
          </h1>
          <p className="text-sm text-muted-foreground">
            {simulation.client
              ? `${simulation.client.first_name} ${simulation.client.last_name}`
              : "Client"}
            {" · "}
            {formatCurrency(simulation.reste_a_charge)}
          </p>
        </div>
      </div>

      {/* Payment mode */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mode de règlement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_MODES.map((mode) => (
              <Button
                key={mode.value}
                variant={
                  paymentMode === mode.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setPaymentMode(mode.value)}
                className="w-full"
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Multi-payment schedule */}
      {paymentMode === "multipaiement" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Échéancier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedule.map((row, i) => {
              const rowAmount =
                (simulation.reste_a_charge * row.percentage) / 100;
              return (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={row.label}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateScheduleRow(i, "label", e.target.value)
                    }
                    placeholder="Libellé"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={row.percentage || ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateScheduleRow(
                          i,
                          "percentage",
                          e.target.value
                        )
                      }
                      className="w-16 text-right"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <span className="w-20 text-right text-xs text-muted-foreground">
                    {formatCurrency(rowAmount)}
                  </span>
                  {schedule.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeScheduleRow(i)}
                      className="h-8 w-8 shrink-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={addScheduleRow}
              >
                <Plus className="mr-1 h-3 w-3" />
                Ajouter une ligne
              </Button>
              <span
                className={`text-sm font-medium ${
                  totalSchedulePercent === 100
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                Total : {totalSchedulePercent}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financing options */}
      {paymentMode === "financement" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Financement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report type */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type de report
              </label>
              <div className="mt-1.5 flex gap-2">
                <Button
                  variant={
                    reportType === "30j" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setReportType("30j")}
                  className="flex-1"
                >
                  Report 30 jours
                </Button>
                <Button
                  variant={
                    reportType === "90j" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setReportType("90j")}
                  className="flex-1"
                >
                  Report 90 jours
                </Button>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Durée du financement
              </label>
              <select
                value={financingMonths}
                onChange={(e) =>
                  setFinancingMonths(Number(e.target.value))
                }
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {FINANCING_DURATIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} mois ({Math.floor(m / 12)} ans
                    {m % 12 > 0 ? ` ${m % 12} mois` : ""})
                  </option>
                ))}
              </select>
            </div>

            {/* Deposit */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Acompte (€)
              </label>
              <Input
                type="number"
                inputMode="numeric"
                value={depositAmount || ""}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setDepositAmount(
                    Math.min(
                      Number(e.target.value) || 0,
                      simulation.reste_a_charge
                    )
                  )
                }
                min={0}
                max={simulation.reste_a_charge}
                className="mt-1.5"
              />
            </div>

            {/* Calculated monthly */}
            {financing && financing.monthly_payment > 0 && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Montant financé
                  </span>
                  <span className="font-medium">
                    {formatCurrency(amountToFinance)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">
                    Taux appliqué
                  </span>
                  <span className="font-medium">
                    {(financing.rate * 100).toFixed(4)}%
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t pt-2">
                  <span className="font-medium">
                    Mensualité estimée
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(financing.monthly_payment)}/mois
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Reste à charge
            </span>
            <span className="font-bold">
              {formatCurrency(simulation.reste_a_charge)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Mode de règlement
            </span>
            <span className="font-medium">
              {PAYMENT_MODE_LABELS[paymentMode]}
            </span>
          </div>
          {paymentMode === "financement" &&
            financing &&
            financing.monthly_payment > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Mensualité
                </span>
                <span className="font-medium">
                  {formatCurrency(financing.monthly_payment)}/mois
                </span>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="pb-4">
        <Button
          onClick={handleCreateDevis}
          disabled={
            submitting ||
            (paymentMode === "multipaiement" &&
              totalSchedulePercent !== 100)
          }
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Créer le devis
        </Button>
        {paymentMode === "multipaiement" &&
          totalSchedulePercent !== 100 && (
            <p className="mt-2 text-center text-xs text-red-500">
              Le total de l&apos;échéancier doit être égal à 100%
            </p>
          )}
      </div>
    </div>
  );
}
