"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { SIMULATION_STATUS_LABELS } from "@/types";
import type {
  ConstructionCost,
  Simulation,
  SimulationProduct,
} from "@/types";
import { calculateCostBreakdown } from "@/lib/calculations/costBreakdown";
import type { CostBreakdownResult } from "@/lib/calculations/costBreakdown";
import {
  Loader2,
  Settings,
  BarChart3,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const LABEL_DISPLAY: Record<string, string> = {
  pose: "Pose (main d'œuvre)",
  charpente_bois_surtoiture: "Charpente bois surtoiture",
  charpente_complete: "Charpente complète",
  tole: "Tôle",
  isolant_106: "Isolant BAR-EN-106",
  isolant_109: "Isolant BAR-EN-109",
  commission_commerciale: "Commission commerciale",
  back_office: "Back office",
  transport: "Transport",
  metrage_controle: "Métrage et contrôle",
};

const CATEGORY_MAP: Record<string, string> = {
  main_oeuvre: "Main d'œuvre",
  materiau: "Matériaux",
  logistique: "Logistique",
};

const CATEGORY_ORDER = ["materiau", "main_oeuvre", "logistique"];

type Tab = "config" | "rentabilite";
type StatusFilter = "accepte" | "devis_envoye" | "all";

export default function ConstructionCostsPage() {
  const [tab, setTab] = useState<Tab>("rentabilite");
  const [costs, setCosts] = useState<ConstructionCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [allProducts, setAllProducts] = useState<SimulationProduct[]>([]);
  const [loadingSims, setLoadingSims] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("accepte");

  const supabase = createClient();

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("construction_costs")
      .select("id, label, price_per_unit, tva_rate, category");

    if (error) {
      toast.error("Erreur lors du chargement des coûts de chantier");
      setLoading(false);
      return;
    }

    setCosts(data as ConstructionCost[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSimulations = useCallback(async () => {
    setLoadingSims(true);
    const [{ data: sims }, { data: products }] = await Promise.all([
      supabase
        .from("simulations")
        .select("*, client:clients(*)")
        .in("status", ["accepte", "devis_envoye"])
        .order("created_at", { ascending: false }),
      supabase
        .from("simulation_products")
        .select("*, product:complementary_products(*)"),
    ]);

    setSimulations((sims as Simulation[]) ?? []);
    setAllProducts((products as SimulationProduct[]) ?? []);
    setLoadingSims(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCosts();
    fetchSimulations();
  }, [fetchCosts, fetchSimulations]);

  function handleFieldChange(
    id: string,
    field: "price_per_unit" | "tva_rate",
    value: string
  ) {
    setCosts((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, [field]: value === "" ? 0 : parseFloat(value) }
          : c
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    const updates = costs.map((c) =>
      supabase
        .from("construction_costs")
        .update({
          price_per_unit: c.price_per_unit,
          tva_rate: c.tva_rate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", c.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Coûts de chantier sauvegardés");
    }
    setSaving(false);
  }

  const getBreakdown = useCallback(
    (sim: Simulation): CostBreakdownResult => {
      const simProducts = allProducts.filter(
        (p) => p.simulation_id === sim.id
      );
      return calculateCostBreakdown(sim, costs, simProducts);
    },
    [allProducts, costs]
  );

  const grouped = CATEGORY_ORDER.reduce<Record<string, ConstructionCost[]>>(
    (acc, cat) => {
      acc[cat] = costs.filter((c) => c.category === cat);
      return acc;
    },
    {}
  );

  const acceptedSims = useMemo(
    () => simulations.filter((s) => s.status === "accepte"),
    [simulations]
  );
  const sentSims = useMemo(
    () => simulations.filter((s) => s.status === "devis_envoye"),
    [simulations]
  );

  const filteredSims = useMemo(() => {
    if (statusFilter === "accepte") return acceptedSims;
    if (statusFilter === "devis_envoye") return sentSims;
    return simulations;
  }, [statusFilter, acceptedSims, sentSims, simulations]);

  const kpiAccepted = useMemo(() => {
    return acceptedSims.reduce(
      (acc, sim) => {
        const bd = getBreakdown(sim);
        acc.ca_ht += bd.prix_vente_ht;
        acc.cout_ht += bd.grand_total_cost_ht;
        acc.marge += bd.marge_brute;
        return acc;
      },
      { ca_ht: 0, cout_ht: 0, marge: 0, count: acceptedSims.length }
    );
  }, [acceptedSims, getBreakdown]);

  const kpiSent = useMemo(() => {
    return sentSims.reduce(
      (acc, sim) => {
        const bd = getBreakdown(sim);
        acc.ca_ht += bd.prix_vente_ht;
        acc.cout_ht += bd.grand_total_cost_ht;
        acc.marge += bd.marge_brute;
        return acc;
      },
      { ca_ht: 0, cout_ht: 0, marge: 0, count: sentSims.length }
    );
  }, [sentSims, getBreakdown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Coûts de chantier
        </h1>
        <p className="text-muted-foreground">
          Rentabilité HT par dossier et configuration des coûts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("rentabilite")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "rentabilite"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Rentabilité par chantier
        </button>
        <button
          onClick={() => setTab("config")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "config"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="h-4 w-4" />
          Configuration des coûts
        </button>
      </div>

      {tab === "rentabilite" && (
        <RentabiliteTab
          filteredSims={filteredSims}
          loading={loadingSims}
          getBreakdown={getBreakdown}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          kpiAccepted={kpiAccepted}
          kpiSent={kpiSent}
        />
      )}

      {tab === "config" && (
        <ConfigTab
          grouped={grouped}
          saving={saving}
          onFieldChange={handleFieldChange}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── Rentabilité Tab ───

interface KpiData {
  ca_ht: number;
  cout_ht: number;
  marge: number;
  count: number;
}

function RentabiliteTab({
  filteredSims,
  loading,
  getBreakdown,
  expandedId,
  setExpandedId,
  statusFilter,
  setStatusFilter,
  kpiAccepted,
  kpiSent,
}: {
  filteredSims: Simulation[];
  loading: boolean;
  getBreakdown: (sim: Simulation) => CostBreakdownResult;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  kpiAccepted: KpiData;
  kpiSent: KpiData;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const margePercentAccepted =
    kpiAccepted.ca_ht > 0
      ? Math.round((kpiAccepted.marge / kpiAccepted.ca_ht) * 10000) / 100
      : 0;
  const margePercentSent =
    kpiSent.ca_ht > 0
      ? Math.round((kpiSent.marge / kpiSent.ca_ht) * 10000) / 100
      : 0;

  return (
    <div className="space-y-4">
      {/* KPI: Dossiers acceptés = CA confirmé */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-semibold">
            CA confirmé HT — {kpiAccepted.count} dossier{kpiAccepted.count > 1 ? "s" : ""} accepté{kpiAccepted.count > 1 ? "s" : ""}
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">CA HT confirmé</p>
              <p className="text-lg font-bold">
                {formatCurrency(kpiAccepted.ca_ht)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Coûts HT</p>
              <p className="text-lg font-bold">
                {formatCurrency(kpiAccepted.cout_ht)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Marge brute HT</p>
              <p
                className={`text-lg font-bold ${kpiAccepted.marge >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(kpiAccepted.marge)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Taux de marge</p>
              <p className="text-lg font-bold">{margePercentAccepted}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KPI: Devis envoyés = CA potentiel */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold">
            CA potentiel HT — {kpiSent.count} devis envoyé{kpiSent.count > 1 ? "s" : ""}
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">CA HT potentiel</p>
              <p className="text-lg font-bold">
                {formatCurrency(kpiSent.ca_ht)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Coûts HT</p>
              <p className="text-lg font-bold">
                {formatCurrency(kpiSent.cout_ht)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Marge brute HT</p>
              <p
                className={`text-lg font-bold ${kpiSent.marge >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(kpiSent.marge)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Taux de marge</p>
              <p className="text-lg font-bold">{margePercentSent}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {(
          [
            { value: "accepte", label: "Acceptés", icon: CheckCircle2 },
            { value: "devis_envoye", label: "Devis envoyés", icon: Send },
            { value: "all", label: "Tous" },
          ] as const
        ).map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {"icon" in f && f.icon && <f.icon className="h-3 w-3" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Simulation list */}
      {filteredSims.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">
              Aucun dossier dans cette catégorie
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Détail par chantier — {filteredSims.length} dossier{filteredSims.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Surface
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      CA HT
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Coût HT
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Marge HT
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      %
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="w-10 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredSims.map((sim) => {
                    const bd = getBreakdown(sim);
                    const isExpanded = expandedId === sim.id;

                    return (
                      <SimulationRow
                        key={sim.id}
                        sim={sim}
                        bd={bd}
                        isExpanded={isExpanded}
                        onToggle={() =>
                          setExpandedId(isExpanded ? null : sim.id)
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SimulationRow({
  sim,
  bd,
  isExpanded,
  onToggle,
}: {
  sim: Simulation;
  bd: CostBreakdownResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isNegative = bd.marge_brute < 0;

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b transition-colors hover:bg-muted/30"
      >
        <td className="px-4 py-3 font-medium">
          {sim.client
            ? `${sim.client.first_name} ${sim.client.last_name}`
            : "—"}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {formatDate(sim.created_at)}
        </td>
        <td className="px-4 py-3 text-right">{sim.surface_m2} m²</td>
        <td className="px-4 py-3 text-right font-medium">
          {formatCurrency(bd.prix_vente_ht)}
        </td>
        <td className="px-4 py-3 text-right">
          {formatCurrency(bd.grand_total_cost_ht)}
        </td>
        <td
          className={`px-4 py-3 text-right font-semibold ${isNegative ? "text-red-600" : "text-green-600"}`}
        >
          <span className="inline-flex items-center gap-1">
            {isNegative ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" />
            )}
            {formatCurrency(bd.marge_brute)}
          </span>
        </td>
        <td
          className={`px-4 py-3 text-right font-medium ${isNegative ? "text-red-600" : "text-green-600"}`}
        >
          {bd.marge_percent}%
        </td>
        <td className="px-4 py-3 text-center">
          <Badge
            variant={sim.status === "accepte" ? "default" : "secondary"}
            className={
              sim.status === "accepte"
                ? "bg-green-600 hover:bg-green-600/80"
                : sim.status === "devis_envoye"
                  ? "bg-blue-600 hover:bg-blue-600/80 text-white"
                  : ""
            }
          >
            {SIMULATION_STATUS_LABELS[sim.status] ?? sim.status}
          </Badge>
        </td>
        <td className="px-2 py-3 text-center">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={9} className="bg-muted/20 px-6 py-4">
            <CostDetailPanel bd={bd} sim={sim} />
          </td>
        </tr>
      )}
    </>
  );
}

function CostDetailPanel({
  bd,
  sim,
}: {
  bd: CostBreakdownResult;
  sim: Simulation;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Cost lines */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Détail des coûts HT
          </h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="pb-1.5 text-left font-medium text-muted-foreground">
                  Poste
                </th>
                <th className="pb-1.5 text-right font-medium text-muted-foreground">
                  Qté
                </th>
                <th className="pb-1.5 text-right font-medium text-muted-foreground">
                  P.U. HT
                </th>
                <th className="pb-1.5 text-right font-medium text-muted-foreground">
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {bd.lines.map((line, i) => (
                <tr key={i} className="border-b border-muted/50">
                  <td className="py-1.5">{line.label}</td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {line.quantity} {line.unit_label}
                  </td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {formatCurrency(line.unit_cost)}
                  </td>
                  <td className="py-1.5 text-right font-medium">
                    {formatCurrency(line.total_ht)}
                  </td>
                </tr>
              ))}
              {bd.products_cost_ht > 0 && (
                <tr className="border-b border-muted/50">
                  <td className="py-1.5" colSpan={3}>
                    Produits complémentaires (coût HT)
                  </td>
                  <td className="py-1.5 text-right font-medium">
                    {formatCurrency(bd.products_cost_ht)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="pt-2" colSpan={3}>
                  Total coûts HT
                </td>
                <td className="pt-2 text-right">
                  {formatCurrency(bd.grand_total_cost_ht)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Résumé financier HT
          </h4>
          <div className="space-y-2 rounded-lg border bg-card p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix de vente HT</span>
              <span className="font-medium">
                {formatCurrency(bd.prix_vente_ht)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coût total HT</span>
              <span className="font-medium">
                {formatCurrency(bd.grand_total_cost_ht)}
              </span>
            </div>
            <div className="border-t pt-2" />
            <div className="flex justify-between">
              <span className="font-semibold">Marge brute HT</span>
              <span
                className={`text-lg font-bold ${bd.marge_brute >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(bd.marge_brute)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taux de marge</span>
              <span
                className={`font-semibold ${bd.marge_percent >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {bd.marge_percent}%
              </span>
            </div>

            <div className="border-t pt-2" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Surface</span>
              <span>{sim.surface_m2} m²</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Type de tôle</span>
              <span className="uppercase">{sim.sheet_type}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Charpente</span>
              <span>{sim.needs_framework ? "Oui" : "Non"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Remise ZENITH ECO</span>
              <span>{formatCurrency(sim.remise_zenith_eco)}</span>
            </div>

            <div className="border-t pt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Prix vente TTC (réf.)</span>
                <span>{formatCurrency(bd.prix_vente_ttc)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Configuration Tab ───

function ConfigTab({
  grouped,
  saving,
  onFieldChange,
  onSave,
}: {
  grouped: Record<string, ConstructionCost[]>;
  saving: boolean;
  onFieldChange: (
    id: string,
    field: "price_per_unit" | "tva_rate",
    value: string
  ) => void;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Postes de coûts</CardTitle>
        <Button onClick={onSave} disabled={saving} size="sm">
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
                  Label
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Prix unitaire (€)
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  TVA (%)
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Catégorie
                </th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((category) => {
                const items = grouped[category] ?? [];
                if (items.length === 0) return null;
                return (
                  <CategoryGroup
                    key={category}
                    category={category}
                    items={items}
                    onFieldChange={onFieldChange}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryGroup({
  category,
  items,
  onFieldChange,
}: {
  category: string;
  items: ConstructionCost[];
  onFieldChange: (
    id: string,
    field: "price_per_unit" | "tva_rate",
    value: string
  ) => void;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={4}
          className="pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {CATEGORY_MAP[category] ?? category}
        </td>
      </tr>
      {items.map((cost) => (
        <tr key={cost.id} className="border-b last:border-0">
          <td className="py-2 pr-4 font-medium">
            {LABEL_DISPLAY[cost.label] ?? cost.label}
          </td>
          <td className="py-2 pr-4">
            <Input
              type="number"
              step="0.01"
              min="0"
              className="w-32"
              value={cost.price_per_unit}
              onChange={(e) =>
                onFieldChange(cost.id, "price_per_unit", e.target.value)
              }
            />
          </td>
          <td className="py-2 pr-4">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              className="w-24"
              value={cost.tva_rate}
              onChange={(e) =>
                onFieldChange(cost.id, "tva_rate", e.target.value)
              }
            />
          </td>
          <td className="py-2 text-muted-foreground">
            {CATEGORY_MAP[cost.category] ?? cost.category}
          </td>
        </tr>
      ))}
    </>
  );
}
