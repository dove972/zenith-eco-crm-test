export type UserRole = "admin" | "manager" | "commercial";
export type MprClientType = "bleu" | "jaune" | "violet" | "rose";
export type SheetType = "acier" | "alu";
export type SimulationStatus =
  | "brouillon"
  | "devis_envoye"
  | "accepte"
  | "refuse"
  | "expire";
export type DevisStatus =
  | "brouillon"
  | "envoye"
  | "accepte"
  | "refuse"
  | "expire";
export type PaymentMode =
  | "comptant"
  | "multipaiement"
  | "financement"
  | "cheque"
  | "especes"
  | "credit_moderne"
  | "fonds_propres_banque"
  | "fonds_propres_cheque"
  | "virement";
export type ReportType = "30j" | "90j";
export type DocumentType =
  | "identity"
  | "tax_notice"
  | "property_tax"
  | "payslips"
  | "rib"
  | "edf_invoice";
export type DocumentStatus = "pending" | "verified" | "rejected";
export type ProductCategory =
  | "chauffe_eau"
  | "gouttiere"
  | "faux_plafond"
  | "bois"
  | "electricite"
  | "plomberie"
  | "peinture"
  | "etancheite"
  | "ventilation"
  | "securite"
  | "nettoyage"
  | "accessoires"
  | "autre";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          role: UserRole;
          manager_id: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          role?: UserRole;
          manager_id?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          role?: UserRole;
          manager_id?: string | null;
          phone?: string | null;
          active?: boolean;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          address: string;
          postal_code: string;
          city: string;
          phone: string;
          is_owner: boolean;
          is_primary_residence: boolean;
          tax_persons_count: number;
          tax_reference_income: number;
          house_over_2_years: boolean;
          mpr_client_type: MprClientType;
          mpr_account_amount: number;
          commercial_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          address: string;
          postal_code: string;
          city: string;
          phone: string;
          is_owner?: boolean;
          is_primary_residence?: boolean;
          tax_persons_count?: number;
          tax_reference_income?: number;
          house_over_2_years?: boolean;
          mpr_client_type?: MprClientType;
          mpr_account_amount?: number;
          commercial_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          email?: string | null;
          address?: string;
          postal_code?: string;
          city?: string;
          phone?: string;
          is_owner?: boolean;
          is_primary_residence?: boolean;
          tax_persons_count?: number;
          tax_reference_income?: number;
          house_over_2_years?: boolean;
          mpr_client_type?: MprClientType;
          mpr_account_amount?: number;
          updated_at?: string;
        };
      };
      simulations: {
        Row: {
          id: string;
          client_id: string;
          commercial_id: string;
          sheet_type: SheetType;
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
          status: SimulationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          commercial_id: string;
          sheet_type?: SheetType;
          roof_panels_count?: number;
          needs_framework?: boolean;
          already_isolated_106?: boolean;
          already_isolated_109?: boolean;
          surface_m2: number;
          total_ht?: number;
          total_tva?: number;
          total_ttc?: number;
          remise_zenith_eco?: number;
          prime_cee_106?: number;
          prime_cee_109?: number;
          prime_mpr_106?: number;
          prime_mpr_109?: number;
          reste_a_charge?: number;
          status?: SimulationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sheet_type?: SheetType;
          roof_panels_count?: number;
          needs_framework?: boolean;
          already_isolated_106?: boolean;
          already_isolated_109?: boolean;
          surface_m2?: number;
          total_ht?: number;
          total_tva?: number;
          total_ttc?: number;
          remise_zenith_eco?: number;
          prime_cee_106?: number;
          prime_cee_109?: number;
          prime_mpr_106?: number;
          prime_mpr_109?: number;
          reste_a_charge?: number;
          status?: SimulationStatus;
          updated_at?: string;
        };
      };
      simulation_products: {
        Row: {
          id: string;
          simulation_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          simulation_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Update: {
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
      };
      devis: {
        Row: {
          id: string;
          simulation_id: string;
          devis_number: string;
          status: DevisStatus;
          payment_mode: PaymentMode;
          payment_schedule: Record<string, unknown>;
          report_type: ReportType | null;
          financing_months: number | null;
          deposit_amount: number;
          monthly_payment: number | null;
          pdf_url: string | null;
          legal_mentions: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          simulation_id: string;
          devis_number: string;
          status?: DevisStatus;
          payment_mode?: PaymentMode;
          payment_schedule?: Record<string, unknown>;
          report_type?: ReportType | null;
          financing_months?: number | null;
          deposit_amount?: number;
          monthly_payment?: number | null;
          pdf_url?: string | null;
          legal_mentions?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: DevisStatus;
          payment_mode?: PaymentMode;
          payment_schedule?: Record<string, unknown>;
          report_type?: ReportType | null;
          financing_months?: number | null;
          deposit_amount?: number;
          monthly_payment?: number | null;
          pdf_url?: string | null;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          doc_type: DocumentType;
          storage_path: string;
          file_name: string;
          status: DocumentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          doc_type: DocumentType;
          storage_path: string;
          file_name: string;
          status?: DocumentStatus;
          created_at?: string;
        };
        Update: {
          status?: DocumentStatus;
        };
      };
      sale_prices: {
        Row: {
          id: string;
          label: string;
          price_per_m2: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          label: string;
          price_per_m2: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          price_per_m2?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      mpr_thresholds: {
        Row: {
          id: string;
          persons_count: number;
          threshold_bleu: number;
          threshold_jaune: number;
          threshold_violet: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          persons_count: number;
          threshold_bleu: number;
          threshold_jaune: number;
          threshold_violet: number;
          updated_at?: string;
        };
        Update: {
          threshold_bleu?: number;
          threshold_jaune?: number;
          threshold_violet?: number;
          updated_at?: string;
        };
      };
      mpr_rates: {
        Row: {
          id: string;
          operation: string;
          bleu: number;
          jaune: number;
          violet: number;
          rose: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          operation: string;
          bleu: number;
          jaune: number;
          violet: number;
          rose: number;
          updated_at?: string;
        };
        Update: {
          bleu?: number;
          jaune?: number;
          violet?: number;
          rose?: number;
          updated_at?: string;
        };
      };
      cee_rates: {
        Row: {
          id: string;
          operation: string;
          bleu: number;
          jaune: number;
          violet: number;
          rose: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          operation: string;
          bleu: number;
          jaune: number;
          violet: number;
          rose: number;
          updated_at?: string;
        };
        Update: {
          bleu?: number;
          jaune?: number;
          violet?: number;
          rose?: number;
          updated_at?: string;
        };
      };
      credit_rates: {
        Row: {
          id: string;
          report_type: ReportType;
          months: number;
          rate: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_type: ReportType;
          months: number;
          rate: number;
          updated_at?: string;
        };
        Update: {
          rate?: number;
          updated_at?: string;
        };
      };
      construction_costs: {
        Row: {
          id: string;
          label: string;
          price_per_unit: number;
          tva_rate: number;
          category: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          price_per_unit: number;
          tva_rate: number;
          category?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          price_per_unit?: number;
          tva_rate?: number;
          category?: string;
          updated_at?: string;
        };
      };
      complementary_products: {
        Row: {
          id: string;
          name: string;
          category: ProductCategory;
          unit_price_sell: number;
          unit_price_cost: number;
          tva_rate: number;
          unit_label: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: ProductCategory;
          unit_price_sell: number;
          unit_price_cost?: number;
          tva_rate?: number;
          unit_label?: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          category?: ProductCategory;
          unit_price_sell?: number;
          unit_price_cost?: number;
          tva_rate?: number;
          unit_label?: string;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      mpr_client_type: MprClientType;
      sheet_type: SheetType;
      simulation_status: SimulationStatus;
      devis_status: DevisStatus;
      payment_mode: PaymentMode;
      report_type: ReportType;
      document_type: DocumentType;
      document_status: DocumentStatus;
      product_category: ProductCategory;
    };
  };
}
