"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SIMULATION_STATUS_LABELS, PAYMENT_MODE_LABELS } from "@/types";
import type { Simulation, Devis, ConstructionCost, SimulationProduct } from "@/types";
import { ArrowLeft, FileText, Camera, Loader2, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { useSimulationBasePath } from "@/hooks/use-simulation-paths";
import { useAuth } from "@/hooks/use-auth";
import { calculateCostBreakdown } from "@/lib/calculations/costBreakdown";
import type { CostBreakdownResult } from "@/lib/calculations/costBreakdown";
import { toast } from "sonner";

function getStatusBadgeProps(status: string) {
  switch (status) {
    case "brouillon":
      return { variant: "secondary" as const };
    case "devis_envoye":
    case "envoye":
      return { variant: "default" as const };
    case "accepte":
      return {
        variant: "default" as const,
        className: "bg-green-600 hover:bg-green-600/80",
      };
    case "refuse":
      return { variant: "destructive" as const };
    default:
      return { variant: "outline" as const };
  }
}

export default function SimulationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const basePath = useSimulationBasePath();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [devis, setDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownResult | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: simData } = await supabase
        .from("simulations")
        .select("*, client:clients(*)")
        .eq("id", id)
        .single();

      if (simData) {
        setSimulation(simData as Simulation);

        const { data: devisData } = await supabase
          .from("devis")
          .select("*")
          .eq("simulation_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (devisData) {
          setDevis(devisData as Devis);
        }

        if (isAdmin) {
          const [{ data: costs }, { data: simProducts }] = await Promise.all([
            supabase.from("construction_costs").select("*"),
            supabase
              .from("simulation_products")
              .select("*, product:complementary_products(*)")
              .eq("simulation_id", id),
          ]);

          if (costs) {
            const breakdown = calculateCostBreakdown(
              simData as Simulation,
              costs as ConstructionCost[],
              (simProducts as SimulationProduct[]) ?? []
            );
            setCostBreakdown(breakdown);
          }
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [id, isAdmin]);

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

  async function handleStatusChange(newStatus: Simulation["status"]) {
    if (!simulation || updatingStatus) return;
    setUpdatingStatus(true);
    const supabase = createClient();

    const { error: simError } = await supabase
      .from("simulations")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", simulation.id);

    if (devis) {
      const devisStatus = newStatus === "devis_envoye" ? "envoye" : newStatus;
      if (["accepte", "refuse", "brouillon"].includes(devisStatus)) {
        await supabase
          .from("devis")
          .update({ status: devisStatus as Devis["status"], updated_at: new Date().toISOString() })
          .eq("simulation_id", simulation.id);
        setDevis((prev) => prev ? { ...prev, status: devisStatus as Devis["status"] } : prev);
      }
    }

    if (simError) {
      toast.error("Erreur lors du changement de statut");
    } else {
      setSimulation((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Statut passé à "${SIMULATION_STATUS_LABELS[newStatus]}"`);
    }
    setUpdatingStatus(false);
    setStatusMenuOpen(false);
  }

  const client = simulation.client;
  const totalPrimes =
    simulation.prime_cee_106 +
    simulation.prime_cee_109 +
    simulation.prime_mpr_106 +
    simulation.prime_mpr_109;

  const STATUS_OPTIONS: { value: Simulation["status"]; label: string; className: string }[] = [
    { value: "brouillon", label: "Brouillon", className: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
    { value: "devis_envoye", label: "Devis envoyé", className: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { value: "accepte", label: "Accepté", className: "bg-green-100 text-green-700 hover:bg-green-200" },
    { value: "refuse", label: "Refusé", className: "bg-red-100 text-red-700 hover:bg-red-200" },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={basePath}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">
            Simulation
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(simulation.created_at)}
          </p>
        </div>

        {isAdmin ? (
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              disabled={updatingStatus}
              className="inline-flex items-center gap-1"
            >
              <Badge {...getStatusBadgeProps(simulation.status)} className={`cursor-pointer ${getStatusBadgeProps(simulation.status).className ?? ""}`}>
                {updatingStatus ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                {SIMULATION_STATUS_LABELS[simulation.status] ?? simulation.status}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Badge>
            </button>
            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border bg-white p-1 shadow-lg">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      disabled={simulation.status === opt.value}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors disabled:opacity-40 ${opt.className}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <Badge {...getStatusBadgeProps(simulation.status)}>
            {SIMULATION_STATUS_LABELS[simulation.status] ?? simulation.status}
          </Badge>
        )}
      </div>

      {/* Section 1: Client */}
      {client && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">
                {client.first_name} {client.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adresse</span>
              <span className="font-medium text-right max-w-[60%]">
                {client.address}, {client.postal_code} {client.city}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Téléphone</span>
              <span className="font-medium">{client.phone}</span>
            </div>
            {client.comments && (
              <div className="border-t pt-2">
                <span className="text-muted-foreground text-xs">Commentaires</span>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{client.comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 2: Chantier */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Chantier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type de tôle</span>
            <span className="font-medium uppercase">
              {simulation.sheet_type}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Surface</span>
            <span className="font-medium">{simulation.surface_m2} m²</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Charpente</span>
            <span className="font-medium">
              {simulation.needs_framework ? "Oui" : "Non"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre de pans</span>
            <span className="font-medium">
              {simulation.roof_panels_count}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Résultats financiers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Résultats financiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total TTC</span>
            <span className="text-lg font-bold">
              {formatCurrency(simulation.total_ttc)}
            </span>
          </div>

          <div className="space-y-1.5 border-t pt-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CEE BAR-EN-106</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(simulation.prime_cee_106)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CEE BAR-EN-109</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(simulation.prime_cee_109)}
              </span>
            </div>
            {simulation.prime_mpr_106 > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">MPR BAR-EN-106</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(simulation.prime_mpr_106)}
                </span>
              </div>
            )}
            {simulation.prime_mpr_109 > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">MPR BAR-EN-109</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(simulation.prime_mpr_109)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remise ZENITH ECO</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(simulation.remise_zenith_eco)}
              </span>
            </div>
          </div>

          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Total des primes</span>
            <span className="font-bold text-green-600">
              -{formatCurrency(totalPrimes)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-2">
            <span className="font-bold">Reste à charge</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(simulation.reste_a_charge)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Coûts & Marge (admin only) */}
      {isAdmin && costBreakdown && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span>Coûts & Marge</span>
              <Badge variant="outline" className="text-[10px] font-normal">
                Admin
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix de vente HT</span>
              <span className="font-medium">
                {formatCurrency(costBreakdown.prix_vente_ht)}
              </span>
            </div>

            {costBreakdown.lines.map((line, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{line.label}</span>
                <span className="font-medium">
                  {formatCurrency(line.total_ht)}
                </span>
              </div>
            ))}
            {costBreakdown.products_cost_ht > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Produits complémentaires (coût HT)
                </span>
                <span className="font-medium">
                  {formatCurrency(costBreakdown.products_cost_ht)}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Coût total HT</span>
              <span className="font-bold">
                {formatCurrency(costBreakdown.grand_total_cost_ht)}
              </span>
            </div>

            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Marge brute HT</span>
              <span
                className={`inline-flex items-center gap-1 text-lg font-bold ${
                  costBreakdown.marge_brute >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {costBreakdown.marge_brute >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatCurrency(costBreakdown.marge_brute)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Taux de marge</span>
              <span
                className={`font-semibold ${
                  costBreakdown.marge_percent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {costBreakdown.marge_percent}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Devis */}
      {devis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Devis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Numéro</span>
              <span className="font-medium">{devis.devis_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Statut</span>
              <Badge {...getStatusBadgeProps(devis.status)}>
                {devis.status}
              </Badge>
            </div>
            {devis.payment_mode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode de paiement</span>
                <span className="font-medium">
                  {PAYMENT_MODE_LABELS[devis.payment_mode] ??
                    devis.payment_mode}
                </span>
              </div>
            )}
            {devis.monthly_payment != null && devis.monthly_payment > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mensualité</span>
                <span className="font-medium">
                  {formatCurrency(devis.monthly_payment)}/mois
                </span>
              </div>
            )}
            {devis.pdf_url && (
              <a
                href={devis.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                Voir le PDF
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        <Link href={`${basePath}/${id}/devis`} className={devis ? "col-span-1" : "col-span-2"}>
          <Button className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            {devis ? "Voir le devis" : "Générer le devis"}
          </Button>
        </Link>
        <Link href={`${basePath}/${id}/documents`}>
          <Button variant="outline" className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Documents
          </Button>
        </Link>
      </div>
    </div>
  );
}
