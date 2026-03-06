import type {
  MprClientType,
  SheetType,
  MprThreshold,
  MprRate,
  CeeRate,
  CreditRate,
  SalePrice,
  ComplementaryProduct,
} from "@/types";

// ─── Types for calculation inputs/outputs ───

export interface EligibilityInput {
  is_owner: boolean;
  is_primary_residence: boolean;
  house_over_2_years: boolean;
  already_isolated_106: boolean;
  already_isolated_109: boolean;
}

export interface EligibilityResult {
  mpr_106: boolean;
  mpr_109: boolean;
  cee_106: boolean;
  cee_109: boolean;
}

export interface SimulationInput {
  sheet_type: SheetType;
  needs_framework: boolean;
  surface_m2: number;
  eligibility: EligibilityInput;
  tax_persons_count: number;
  tax_reference_income: number;
  mpr_account_amount: number;
  complementary_products: Array<{
    quantity: number;
    unit_price_sell: number;
    tva_rate: number;
  }>;
}

export interface QuoteLineItem {
  label: string;
  quantity: number;
  unit_price: number;
  tva_rate: number;
  ht: number;
  tva: number;
  ttc: number;
}

export interface SimulationResult {
  mpr_client_type: MprClientType;
  eligibility: EligibilityResult;
  target_price_per_m2: number;
  base_price_ttc: number;
  products_total_ttc: number;
  line_items: QuoteLineItem[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  remise_zenith_eco: number;
  prime_cee_106: number;
  prime_cee_109: number;
  prime_mpr_106: number;
  prime_mpr_109: number;
  total_primes: number;
  reste_a_charge: number;
}

export interface FinancingResult {
  monthly_payment: number;
  total_cost: number;
  rate: number;
}

// ─── Barème data (loaded from DB) ───

export interface BaremeData {
  sale_prices: SalePrice[];
  mpr_thresholds: MprThreshold[];
  mpr_rates: MprRate[];
  cee_rates: CeeRate[];
  credit_rates: CreditRate[];
  devis_line_items: ComplementaryProduct[];
}

// ─── Core calculation functions ───

/**
 * Determines MPR client type based on fiscal income and household size.
 * Martinique-specific thresholds from the barème aides table.
 */
export function determineMprType(
  tax_reference_income: number,
  tax_persons_count: number,
  thresholds: MprThreshold[]
): MprClientType {
  const row = thresholds.find((t) => t.persons_count === tax_persons_count);

  if (!row) {
    const maxRow = thresholds.reduce((max, t) =>
      t.persons_count > max.persons_count ? t : max
    );
    const extraPersons = tax_persons_count - maxRow.persons_count;
    const perPersonSup = thresholds.find((t) => t.persons_count === 6);

    if (perPersonSup && extraPersons > 0) {
      const adjBleu =
        maxRow.threshold_bleu +
        extraPersons * (perPersonSup.threshold_bleu - (thresholds.find((t) => t.persons_count === 5)?.threshold_bleu ?? 0));
      const adjJaune =
        maxRow.threshold_jaune +
        extraPersons * (perPersonSup.threshold_jaune - (thresholds.find((t) => t.persons_count === 5)?.threshold_jaune ?? 0));
      const adjViolet =
        maxRow.threshold_violet +
        extraPersons * (perPersonSup.threshold_violet - (thresholds.find((t) => t.persons_count === 5)?.threshold_violet ?? 0));

      if (tax_reference_income <= adjBleu) return "bleu";
      if (tax_reference_income <= adjJaune) return "jaune";
      if (tax_reference_income <= adjViolet) return "violet";
      return "rose";
    }

    return "rose";
  }

  if (tax_reference_income <= row.threshold_bleu) return "bleu";
  if (tax_reference_income <= row.threshold_jaune) return "jaune";
  if (tax_reference_income <= row.threshold_violet) return "violet";
  return "rose";
}

/**
 * Checks eligibility for each subsidy type.
 * MPR requires: owner + primary residence + house >2y + not already isolated
 * CEE requires: house >2y + not already isolated
 */
export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const baseMpr =
    input.is_owner &&
    input.is_primary_residence &&
    input.house_over_2_years;

  const baseCee = input.house_over_2_years;

  return {
    mpr_106: baseMpr && !input.already_isolated_106,
    mpr_109: baseMpr && !input.already_isolated_109,
    cee_106: baseCee && !input.already_isolated_106,
    cee_109: baseCee && !input.already_isolated_109,
  };
}

/**
 * Gets the target sale price per m2 based on sheet type and framework need.
 */
export function getTargetPricePerM2(
  sheet_type: SheetType,
  needs_framework: boolean,
  sale_prices: SalePrice[]
): number {
  let label: string;
  if (needs_framework) {
    label = sheet_type === "acier" ? "charpente_toles_acier" : "charpente_toles_alu";
  } else {
    label = sheet_type === "acier" ? "toles_acier" : "toles_alu";
  }

  const price = sale_prices.find((p) => p.label === label);
  return price?.price_per_m2 ?? 0;
}

/**
 * Builds the detailed quote line items from the database catalogue.
 * Each line has its own TVA rate (DOM Martinique: 2.1% reduced, 0% for some isolation).
 * Lines are filtered by sheet_type_variant and inclusion_condition.
 */
export function buildLineItems(
  surface: number,
  sheet_type: SheetType,
  needs_framework: boolean,
  eligibility: EligibilityResult,
  devisLineItems: ComplementaryProduct[]
): QuoteLineItem[] {
  // Filter by active + sheet_type_variant only (keep all inclusion conditions)
  const applicable = devisLineItems
    .filter((item) => item.active)
    .filter((item) => {
      // sheet_type_variant: NULL matches all, otherwise must match current sheet_type
      if (item.sheet_type_variant && item.sheet_type_variant !== sheet_type) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  // Build QuoteLineItem[] — items whose inclusion_condition is not met get quantity = 0
  return applicable.map((item) => {
    const conditionMet = (() => {
      switch (item.inclusion_condition) {
        case "always":
          return true;
        case "needs_framework":
          return needs_framework;
        case "eligible_109":
          return eligibility.cee_109 || eligibility.mpr_109;
        case "eligible_106":
          return eligibility.cee_106 || eligibility.mpr_106;
        default:
          return true;
      }
    })();

    let quantity = 0;
    if (conditionMet) {
      quantity = item.quantity_mode === "surface" ? surface : 1;
    }
    return createLineItem(item.name, quantity, item.unit_price_sell, item.tva_rate);
  });
}

function createLineItem(
  label: string,
  quantity: number,
  unit_price: number,
  tva_rate: number
): QuoteLineItem {
  const ht_raw = quantity * unit_price;
  const tva = ht_raw * (tva_rate / 100);
  const ttc = ht_raw;
  const ht = ttc - tva;

  return {
    label,
    quantity,
    unit_price,
    tva_rate,
    ht,
    tva,
    ttc,
  };
}

/**
 * Calculates CEE and MPR subsidies based on client type, surface, and eligibility.
 * MPR is capped by the client's available MPR account amount.
 */
export function calculateSubsidies(
  mpr_client_type: MprClientType,
  surface: number,
  eligibility: EligibilityResult,
  mpr_account_amount: number,
  mpr_rates: MprRate[],
  cee_rates: CeeRate[]
): {
  prime_cee_106: number;
  prime_cee_109: number;
  prime_mpr_106: number;
  prime_mpr_109: number;
} {
  const cee106Rate = cee_rates.find((r) => r.operation === "bar_en_106");
  const cee109Rate = cee_rates.find((r) => r.operation === "bar_en_109");
  const mpr106Rate = mpr_rates.find((r) => r.operation === "bar_en_106");
  const mpr109Rate = mpr_rates.find((r) => r.operation === "bar_en_109");

  const prime_cee_106 = eligibility.cee_106
    ? surface * (cee106Rate?.[mpr_client_type] ?? 0)
    : 0;

  const prime_cee_109 = eligibility.cee_109
    ? surface * (cee109Rate?.[mpr_client_type] ?? 0)
    : 0;

  const hasMprCap = mpr_account_amount > 0;
  let remainingMpr = hasMprCap ? mpr_account_amount : Infinity;

  let prime_mpr_106 = 0;
  if (eligibility.mpr_106 && mpr106Rate) {
    const raw = surface * mpr106Rate[mpr_client_type];
    prime_mpr_106 = Math.min(raw, remainingMpr);
    remainingMpr -= prime_mpr_106;
  }

  let prime_mpr_109 = 0;
  if (eligibility.mpr_109 && mpr109Rate) {
    const raw = surface * mpr109Rate[mpr_client_type];
    prime_mpr_109 = Math.min(raw, remainingMpr);
    remainingMpr -= prime_mpr_109;
  }

  return { prime_cee_106, prime_cee_109, prime_mpr_106, prime_mpr_109 };
}

/**
 * Main simulation calculation.
 * The total quote price is driven by the admin-defined tariff per m2.
 * The "Remise ZENITH ECO" is the adjustment to match the target price.
 */
export function calculateSimulation(
  input: SimulationInput,
  baremes: BaremeData
): SimulationResult {
  // 1. Determine MPR client type
  const mpr_client_type = determineMprType(
    input.tax_reference_income,
    input.tax_persons_count,
    baremes.mpr_thresholds
  );

  // 2. Check eligibility
  const eligibility = checkEligibility(input.eligibility);

  // 3. Get target price per m2 (admin-defined)
  const target_price_per_m2 = getTargetPricePerM2(
    input.sheet_type,
    input.needs_framework,
    baremes.sale_prices
  );

  // 4. Base price = target × surface
  const base_price_ttc = Math.round(target_price_per_m2 * input.surface_m2);

  // 5. Complementary products total
  let products_total_ttc = 0;
  for (const product of input.complementary_products) {
    products_total_ttc += product.quantity * product.unit_price_sell;
  }
  products_total_ttc = Math.round(products_total_ttc);

  // 6. Build detailed line items from catalogue
  const line_items = buildLineItems(
    input.surface_m2,
    input.sheet_type,
    input.needs_framework,
    eligibility,
    baremes.devis_line_items
  );

  // 7. Sum of detailed line items
  const line_items_total_ttc = line_items.reduce(
    (sum, item) => sum + item.ttc,
    0
  );

  // 8. Remise ZENITH ECO = difference between line items total and target base price
  const remise_zenith_eco = Math.round(line_items_total_ttc - base_price_ttc);

  // 9. Final TTC = base_price + products (target-based, not line items)
  const total_ttc = base_price_ttc + products_total_ttc;

  // 10. Calculate TVA and HT
  const total_tva = line_items.reduce((sum, item) => sum + item.tva, 0);
  const products_tva = input.complementary_products.reduce(
    (sum, p) => sum + p.quantity * p.unit_price_sell * (p.tva_rate / 100),
    0
  );
  const final_tva = Math.round((total_tva + products_tva - (remise_zenith_eco > 0 ? remise_zenith_eco * 0.021 : 0)) * 100) / 100;
  const total_ht = Math.round((total_ttc - final_tva) * 100) / 100;

  // 11. Calculate subsidies
  const subsidies = calculateSubsidies(
    mpr_client_type,
    input.surface_m2,
    eligibility,
    input.mpr_account_amount,
    baremes.mpr_rates,
    baremes.cee_rates
  );

  const total_primes =
    subsidies.prime_cee_106 +
    subsidies.prime_cee_109 +
    subsidies.prime_mpr_106 +
    subsidies.prime_mpr_109;

  // 12. Reste à charge
  const reste_a_charge = Math.round(total_ttc - total_primes);

  return {
    mpr_client_type,
    eligibility,
    target_price_per_m2,
    base_price_ttc,
    products_total_ttc,
    line_items,
    total_ht,
    total_tva: final_tva,
    total_ttc,
    remise_zenith_eco,
    ...subsidies,
    total_primes,
    reste_a_charge,
  };
}

/**
 * Calculates monthly payment based on financing amount, report type, and duration.
 * Uses the credit rate table from the Excel (Tx credit moderne).
 * Monthly payment = amount × rate factor
 */
export function calculateMonthlyPayment(
  amount: number,
  report_type: "30j" | "90j",
  months: number,
  credit_rates: CreditRate[]
): FinancingResult {
  const rate_entry = credit_rates.find(
    (r) => r.report_type === report_type && r.months === months
  );

  if (!rate_entry) {
    return { monthly_payment: 0, total_cost: 0, rate: 0 };
  }

  const monthly_payment = Math.round(amount * rate_entry.rate * 100) / 100;
  const total_cost = Math.round(monthly_payment * months * 100) / 100;

  return {
    monthly_payment,
    total_cost,
    rate: rate_entry.rate,
  };
}
