export type {
  UserRole,
  MprClientType,
  SheetType,
  SimulationStatus,
  DevisStatus,
  PaymentMode,
  ReportType,
  DocumentType,
  DocumentStatus,
  ProductCategory,
  Database,
} from "./database";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: "admin" | "manager" | "commercial";
  manager_id: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  is_owner: boolean;
  is_primary_residence: boolean;
  tax_persons_count: number;
  tax_reference_income: number;
  house_over_2_years: boolean;
  mpr_client_type: "bleu" | "jaune" | "violet" | "rose";
  mpr_account_amount: number;
  commercial_id: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface Simulation {
  id: string;
  client_id: string;
  commercial_id: string;
  sheet_type: "acier" | "alu";
  roof_panels_count: number;
  needs_framework: boolean;
  already_isolated_106: boolean;
  already_isolated_109: boolean;
  surface_m2: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  remise_zenith_eco: number;
  prime_cee_106: number;
  prime_cee_109: number;
  prime_mpr_106: number;
  prime_mpr_109: number;
  reste_a_charge: number;
  status: "brouillon" | "devis_envoye" | "accepte" | "refuse" | "expire";
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface ComplementaryProduct {
  id: string;
  name: string;
  category: string;
  unit_price_sell: number;
  unit_price_cost: number;
  tva_rate: number;
  unit_label: string;
  active: boolean;
  sort_order: number;
}

export interface SimulationProduct {
  id: string;
  simulation_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: ComplementaryProduct;
}

export interface Devis {
  id: string;
  simulation_id: string;
  devis_number: string;
  status: "brouillon" | "envoye" | "accepte" | "refuse" | "expire";
  payment_mode: string;
  payment_schedule: Record<string, unknown>;
  report_type: "30j" | "90j" | null;
  financing_months: number | null;
  deposit_amount: number;
  monthly_payment: number | null;
  pdf_url: string | null;
  legal_mentions: string;
  created_at: string;
  updated_at: string;
  simulation?: Simulation;
}

export interface SalePrice {
  id: string;
  label: string;
  price_per_m2: number;
  updated_at: string;
}

export interface MprThreshold {
  id: string;
  persons_count: number;
  threshold_bleu: number;
  threshold_jaune: number;
  threshold_violet: number;
}

export interface MprRate {
  id: string;
  operation: string;
  bleu: number;
  jaune: number;
  violet: number;
  rose: number;
}

export interface CeeRate {
  id: string;
  operation: string;
  bleu: number;
  jaune: number;
  violet: number;
  rose: number;
}

export interface CreditRate {
  id: string;
  report_type: "30j" | "90j";
  months: number;
  rate: number;
}

export interface ConstructionCost {
  id: string;
  label: string;
  price_per_unit: number;
  tva_rate: number;
  category: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const MPR_TYPE_LABELS: Record<string, string> = {
  bleu: "Bleu - Très modeste",
  jaune: "Jaune - Modeste",
  violet: "Violet - Intermédiaire",
  rose: "Rose - Supérieur",
};

export const SIMULATION_STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  devis_envoye: "Devis envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export const DEVIS_STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  comptant: "Comptant",
  multipaiement: "Multi-paiement",
  financement: "Financement",
  cheque: "Chèque",
  especes: "Espèces",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  identity: "Pièce d'identité",
  tax_notice: "Avis d'impôt",
  property_tax: "Taxe foncière + Acte notarié",
  payslips: "3 derniers bulletins de salaire",
  rib: "RIB",
  edf_invoice: "Facture EDF",
};
