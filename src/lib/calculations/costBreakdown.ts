import type { ConstructionCost, Simulation, SimulationProduct } from "@/types";

export interface CostLineItem {
  label: string;
  quantity: number;
  unit_label: string;
  unit_cost: number;
  tva_rate: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  category: string;
}

export interface CostBreakdownResult {
  lines: CostLineItem[];
  total_cost_ht: number;
  total_cost_tva: number;
  total_cost_ttc: number;
  products_cost_ht: number;
  products_cost_ttc: number;
  grand_total_cost_ht: number;
  grand_total_cost_ttc: number;
  prix_vente_ht: number;
  prix_vente_ttc: number;
  marge_brute: number;
  marge_percent: number;
}

function findCost(costs: ConstructionCost[], label: string): ConstructionCost | undefined {
  return costs.find((c) => c.label === label);
}

function makeLine(
  label: string,
  quantity: number,
  unit_label: string,
  unit_cost: number,
  tva_rate: number,
  category: string
): CostLineItem {
  const total_ht = quantity * unit_cost;
  const total_tva = total_ht * (tva_rate / 100);
  return {
    label,
    quantity,
    unit_label,
    unit_cost,
    tva_rate,
    total_ht,
    total_tva,
    total_ttc: total_ht + total_tva,
    category,
  };
}

export function calculateCostBreakdown(
  simulation: Simulation,
  constructionCosts: ConstructionCost[],
  simulationProducts: SimulationProduct[] = []
): CostBreakdownResult {
  const lines: CostLineItem[] = [];
  const surface = simulation.surface_m2;

  const pose = findCost(constructionCosts, "pose");
  if (pose) {
    lines.push(makeLine("Pose (main d'œuvre)", surface, "m²", pose.price_per_unit, pose.tva_rate, "main_oeuvre"));
  }

  const tole = findCost(constructionCosts, "tole");
  if (tole) {
    lines.push(makeLine("Tôle", surface, "m²", tole.price_per_unit, tole.tva_rate, "materiau"));
  }

  if (simulation.needs_framework) {
    const charpenteSur = findCost(constructionCosts, "charpente_bois_surtoiture");
    if (charpenteSur && charpenteSur.price_per_unit > 0) {
      lines.push(makeLine("Charpente bois surtoiture", surface, "m²", charpenteSur.price_per_unit, charpenteSur.tva_rate, "materiau"));
    }
    const charpenteComplete = findCost(constructionCosts, "charpente_complete");
    if (charpenteComplete && charpenteComplete.price_per_unit > 0) {
      lines.push(makeLine("Charpente complète", surface, "m²", charpenteComplete.price_per_unit, charpenteComplete.tva_rate, "materiau"));
    }
  }

  if (!simulation.already_isolated_106) {
    const iso106 = findCost(constructionCosts, "isolant_106");
    if (iso106 && iso106.price_per_unit > 0) {
      lines.push(makeLine("Isolant BAR-EN-106", surface, "m²", iso106.price_per_unit, iso106.tva_rate, "materiau"));
    }
  }

  if (!simulation.already_isolated_109) {
    const iso109 = findCost(constructionCosts, "isolant_109");
    if (iso109 && iso109.price_per_unit > 0) {
      lines.push(makeLine("Isolant BAR-EN-109", surface, "m²", iso109.price_per_unit, iso109.tva_rate, "materiau"));
    }
  }

  const transport = findCost(constructionCosts, "transport");
  if (transport && transport.price_per_unit > 0) {
    lines.push(makeLine("Transport", 1, "forfait", transport.price_per_unit, transport.tva_rate, "logistique"));
  }

  const backOffice = findCost(constructionCosts, "back_office");
  if (backOffice && backOffice.price_per_unit > 0) {
    lines.push(makeLine("Back office", 1, "forfait", backOffice.price_per_unit, backOffice.tva_rate, "logistique"));
  }

  const metrage = findCost(constructionCosts, "metrage_controle");
  if (metrage && metrage.price_per_unit > 0) {
    lines.push(makeLine("Métrage et contrôle", 1, "forfait", metrage.price_per_unit, metrage.tva_rate, "logistique"));
  }

  const commission = findCost(constructionCosts, "commission_commerciale");
  if (commission && commission.price_per_unit > 0) {
    const commissionBase = simulation.total_ht * commission.price_per_unit;
    lines.push(makeLine(
      `Commission commerciale (${commission.price_per_unit * 100}%)`,
      1,
      "forfait",
      commissionBase,
      commission.tva_rate,
      "logistique"
    ));
  }

  const total_cost_ht = lines.reduce((s, l) => s + l.total_ht, 0);
  const total_cost_tva = lines.reduce((s, l) => s + l.total_tva, 0);
  const total_cost_ttc = lines.reduce((s, l) => s + l.total_ttc, 0);

  let products_cost_ht = 0;
  let products_cost_ttc = 0;
  for (const sp of simulationProducts) {
    const costPrice = sp.product?.unit_price_cost ?? sp.unit_price;
    const tvaRate = sp.product?.tva_rate ?? 2.1;
    const ht = sp.quantity * costPrice;
    products_cost_ht += ht;
    products_cost_ttc += ht * (1 + tvaRate / 100);
  }

  const grand_total_cost_ht = Math.round((total_cost_ht + products_cost_ht) * 100) / 100;
  const grand_total_cost_ttc = Math.round((total_cost_ttc + products_cost_ttc) * 100) / 100;

  const prix_vente_ht = simulation.total_ht;
  const prix_vente_ttc = simulation.total_ttc;

  const marge_brute = Math.round((prix_vente_ht - grand_total_cost_ht) * 100) / 100;
  const marge_percent = prix_vente_ht > 0 ? Math.round((marge_brute / prix_vente_ht) * 10000) / 100 : 0;

  return {
    lines,
    total_cost_ht: Math.round(total_cost_ht * 100) / 100,
    total_cost_tva: Math.round(total_cost_tva * 100) / 100,
    total_cost_ttc: Math.round(total_cost_ttc * 100) / 100,
    products_cost_ht: Math.round(products_cost_ht * 100) / 100,
    products_cost_ttc: Math.round(products_cost_ttc * 100) / 100,
    grand_total_cost_ht,
    grand_total_cost_ttc,
    prix_vente_ht,
    prix_vente_ttc,
    marge_brute,
    marge_percent,
  };
}
