import { describe, it, expect } from "vitest";
import {
  determineMprType,
  checkEligibility,
  getTargetPricePerM2,
  calculateSubsidies,
  calculateSimulation,
  calculateMonthlyPayment,
  type BaremeData,
  type SimulationInput,
} from "./simulationEngine";
import type { MprThreshold, SalePrice, MprRate, CeeRate, CreditRate } from "@/types";

// ─── Test data from the Excel file ───

const testThresholds: MprThreshold[] = [
  { id: "1", persons_count: 1, threshold_bleu: 17009, threshold_jaune: 21805, threshold_violet: 30549 },
  { id: "2", persons_count: 2, threshold_bleu: 24875, threshold_jaune: 31889, threshold_violet: 44907 },
  { id: "3", persons_count: 3, threshold_bleu: 29917, threshold_jaune: 38349, threshold_violet: 54071 },
  { id: "4", persons_count: 4, threshold_bleu: 34948, threshold_jaune: 44802, threshold_violet: 63235 },
  { id: "5", persons_count: 5, threshold_bleu: 40002, threshold_jaune: 51281, threshold_violet: 72400 },
];

const testSalePrices: SalePrice[] = [
  { id: "1", label: "toles_acier", price_per_m2: 149, updated_at: "" },
  { id: "2", label: "toles_alu", price_per_m2: 159, updated_at: "" },
  { id: "3", label: "charpente_toles_acier", price_per_m2: 249, updated_at: "" },
  { id: "4", label: "charpente_toles_alu", price_per_m2: 269, updated_at: "" },
];

const testMprRates: MprRate[] = [
  { id: "1", operation: "bar_en_106", bleu: 25, jaune: 20, violet: 15, rose: 0 },
  { id: "2", operation: "bar_en_109", bleu: 25, jaune: 20, violet: 15, rose: 0 },
];

const testCeeRates: CeeRate[] = [
  { id: "1", operation: "bar_en_106", bleu: 16, jaune: 15, violet: 12, rose: 12 },
  { id: "2", operation: "bar_en_109", bleu: 16, jaune: 14, violet: 14, rose: 14 },
];

const testCreditRates: CreditRate[] = [
  { id: "1", report_type: "90j", months: 180, rate: 0.010639 },
  { id: "2", report_type: "30j", months: 180, rate: 0.010496 },
  { id: "3", report_type: "30j", months: 60, rate: 0.021582 },
];

const testBaremes: BaremeData = {
  sale_prices: testSalePrices,
  mpr_thresholds: testThresholds,
  mpr_rates: testMprRates,
  cee_rates: testCeeRates,
  credit_rates: testCreditRates,
};

// ─── Tests ───

describe("determineMprType", () => {
  it("returns 'bleu' for low income with 4 persons", () => {
    expect(determineMprType(24000, 4, testThresholds)).toBe("bleu");
  });

  it("returns 'jaune' for income between bleu and jaune thresholds", () => {
    expect(determineMprType(36000, 4, testThresholds)).toBe("jaune");
  });

  it("returns 'violet' for income between jaune and violet thresholds", () => {
    expect(determineMprType(50000, 4, testThresholds)).toBe("violet");
  });

  it("returns 'rose' for income above violet threshold", () => {
    expect(determineMprType(70000, 4, testThresholds)).toBe("rose");
  });

  it("returns 'bleu' for 1 person with income 15000", () => {
    expect(determineMprType(15000, 1, testThresholds)).toBe("bleu");
  });

  it("returns 'rose' for very high income", () => {
    expect(determineMprType(100000, 1, testThresholds)).toBe("rose");
  });
});

describe("checkEligibility", () => {
  it("returns all eligible when conditions are met", () => {
    const result = checkEligibility({
      is_owner: true,
      is_primary_residence: true,
      house_over_2_years: true,
      already_isolated_106: false,
      already_isolated_109: false,
    });
    expect(result).toEqual({
      mpr_106: true,
      mpr_109: true,
      cee_106: true,
      cee_109: true,
    });
  });

  it("disables MPR when not owner", () => {
    const result = checkEligibility({
      is_owner: false,
      is_primary_residence: true,
      house_over_2_years: true,
      already_isolated_106: false,
      already_isolated_109: false,
    });
    expect(result.mpr_106).toBe(false);
    expect(result.mpr_109).toBe(false);
    expect(result.cee_106).toBe(true);
    expect(result.cee_109).toBe(true);
  });

  it("disables all when house < 2 years", () => {
    const result = checkEligibility({
      is_owner: true,
      is_primary_residence: true,
      house_over_2_years: false,
      already_isolated_106: false,
      already_isolated_109: false,
    });
    expect(result.mpr_106).toBe(false);
    expect(result.cee_106).toBe(false);
  });

  it("disables specific operation when already isolated", () => {
    const result = checkEligibility({
      is_owner: true,
      is_primary_residence: true,
      house_over_2_years: true,
      already_isolated_106: true,
      already_isolated_109: false,
    });
    expect(result.mpr_106).toBe(false);
    expect(result.cee_106).toBe(false);
    expect(result.mpr_109).toBe(true);
    expect(result.cee_109).toBe(true);
  });
});

describe("getTargetPricePerM2", () => {
  it("returns 149 for acier toles without framework", () => {
    expect(getTargetPricePerM2("acier", false, testSalePrices)).toBe(149);
  });

  it("returns 159 for alu toles without framework", () => {
    expect(getTargetPricePerM2("alu", false, testSalePrices)).toBe(159);
  });

  it("returns 249 for acier with framework", () => {
    expect(getTargetPricePerM2("acier", true, testSalePrices)).toBe(249);
  });

  it("returns 269 for alu with framework", () => {
    expect(getTargetPricePerM2("alu", true, testSalePrices)).toBe(269);
  });
});

describe("calculateSubsidies", () => {
  it("calculates CEE correctly for bleu client", () => {
    const result = calculateSubsidies(
      "bleu",
      150,
      { mpr_106: true, mpr_109: true, cee_106: true, cee_109: true },
      20000,
      testMprRates,
      testCeeRates
    );
    expect(result.prime_cee_106).toBe(2400); // 150 * 16
    expect(result.prime_cee_109).toBe(2400); // 150 * 16
  });

  it("calculates MPR correctly for bleu client", () => {
    const result = calculateSubsidies(
      "bleu",
      150,
      { mpr_106: true, mpr_109: true, cee_106: true, cee_109: true },
      20000,
      testMprRates,
      testCeeRates
    );
    expect(result.prime_mpr_106).toBe(3750); // 150 * 25
    expect(result.prime_mpr_109).toBe(3750); // 150 * 25
  });

  it("caps MPR at account amount", () => {
    const result = calculateSubsidies(
      "bleu",
      150,
      { mpr_106: true, mpr_109: true, cee_106: true, cee_109: true },
      5000,
      testMprRates,
      testCeeRates
    );
    expect(result.prime_mpr_106).toBe(3750);
    expect(result.prime_mpr_109).toBe(1250); // 5000 - 3750 remaining
  });

  it("returns 0 MPR for rose client", () => {
    const result = calculateSubsidies(
      "rose",
      150,
      { mpr_106: true, mpr_109: true, cee_106: true, cee_109: true },
      20000,
      testMprRates,
      testCeeRates
    );
    expect(result.prime_mpr_106).toBe(0);
    expect(result.prime_mpr_109).toBe(0);
  });

  it("returns 0 for ineligible operations", () => {
    const result = calculateSubsidies(
      "bleu",
      150,
      { mpr_106: false, mpr_109: false, cee_106: false, cee_109: false },
      20000,
      testMprRates,
      testCeeRates
    );
    expect(result.prime_cee_106).toBe(0);
    expect(result.prime_cee_109).toBe(0);
    expect(result.prime_mpr_106).toBe(0);
    expect(result.prime_mpr_109).toBe(0);
  });
});

describe("calculateSimulation (Excel reference case)", () => {
  // Excel reference: 150m², ACIER, not owner, 4 persons, income 24000, no framework
  const excelInput: SimulationInput = {
    sheet_type: "acier",
    needs_framework: false,
    surface_m2: 150,
    eligibility: {
      is_owner: false,
      is_primary_residence: true,
      house_over_2_years: true,
      already_isolated_106: false,
      already_isolated_109: false,
    },
    tax_persons_count: 4,
    tax_reference_income: 24000,
    mpr_account_amount: 20000,
    complementary_products: [
      { quantity: 1, unit_price_sell: 350, tva_rate: 2.1 },
    ],
  };

  it("determines bleu client type correctly", () => {
    const result = calculateSimulation(excelInput, testBaremes);
    expect(result.mpr_client_type).toBe("bleu");
  });

  it("disables MPR when not owner", () => {
    const result = calculateSimulation(excelInput, testBaremes);
    expect(result.eligibility.mpr_106).toBe(false);
    expect(result.eligibility.mpr_109).toBe(false);
    expect(result.eligibility.cee_106).toBe(true);
    expect(result.eligibility.cee_109).toBe(true);
  });

  it("calculates CEE primes at 2400 each", () => {
    const result = calculateSimulation(excelInput, testBaremes);
    expect(result.prime_cee_106).toBe(2400);
    expect(result.prime_cee_109).toBe(2400);
  });

  it("calculates 0 MPR primes (not owner)", () => {
    const result = calculateSimulation(excelInput, testBaremes);
    expect(result.prime_mpr_106).toBe(0);
    expect(result.prime_mpr_109).toBe(0);
  });

  it("calculates base price as 149 * 150 = 22350", () => {
    const result = calculateSimulation(excelInput, testBaremes);
    expect(result.base_price_ttc).toBe(22350);
  });

  it("calculates target price per m2 as 149", () => {
    const result = calculateSimulation(excelInput, testBaremes);
    expect(result.target_price_per_m2).toBe(149);
  });
});

describe("calculateMonthlyPayment", () => {
  it("calculates monthly payment for 180 months 90j report", () => {
    const result = calculateMonthlyPayment(27847, "90j", 180, testCreditRates);
    expect(result.monthly_payment).toBeCloseTo(296.26, 0);
  });

  it("returns 0 for unknown duration", () => {
    const result = calculateMonthlyPayment(27847, "90j", 999, testCreditRates);
    expect(result.monthly_payment).toBe(0);
  });
});
