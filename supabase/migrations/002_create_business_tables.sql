-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  is_owner BOOLEAN NOT NULL DEFAULT false,
  is_primary_residence BOOLEAN NOT NULL DEFAULT true,
  tax_persons_count INTEGER NOT NULL DEFAULT 1,
  tax_reference_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  house_over_2_years BOOLEAN NOT NULL DEFAULT true,
  mpr_client_type mpr_client_type NOT NULL DEFAULT 'rose',
  mpr_account_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  commercial_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_commercial ON clients(commercial_id);

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Simulations table
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  commercial_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  sheet_type sheet_type NOT NULL DEFAULT 'acier',
  roof_panels_count INTEGER NOT NULL DEFAULT 1,
  needs_framework BOOLEAN NOT NULL DEFAULT false,
  already_isolated_106 BOOLEAN NOT NULL DEFAULT false,
  already_isolated_109 BOOLEAN NOT NULL DEFAULT false,
  surface_m2 NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tva NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
  remise_zenith_eco NUMERIC(12,2) NOT NULL DEFAULT 0,
  prime_cee_106 NUMERIC(12,2) NOT NULL DEFAULT 0,
  prime_cee_109 NUMERIC(12,2) NOT NULL DEFAULT 0,
  prime_mpr_106 NUMERIC(12,2) NOT NULL DEFAULT 0,
  prime_mpr_109 NUMERIC(12,2) NOT NULL DEFAULT 0,
  reste_a_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  status simulation_status NOT NULL DEFAULT 'brouillon',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_simulations_client ON simulations(client_id);
CREATE INDEX idx_simulations_commercial ON simulations(commercial_id);
CREATE INDEX idx_simulations_status ON simulations(status);

CREATE TRIGGER set_simulations_updated_at
  BEFORE UPDATE ON simulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Complementary products (admin-managed catalog)
CREATE TABLE complementary_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category product_category NOT NULL DEFAULT 'autre',
  unit_price_sell NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_price_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  tva_rate NUMERIC(5,2) NOT NULL DEFAULT 2.1,
  unit_label TEXT NOT NULL DEFAULT 'unité',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_complementary_products_updated_at
  BEFORE UPDATE ON complementary_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Simulation products (selected products per simulation)
CREATE TABLE simulation_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES complementary_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_simulation_products_simulation ON simulation_products(simulation_id);

-- Devis counter sequence
CREATE SEQUENCE devis_number_seq START 1;

-- Devis table
CREATE TABLE devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  devis_number TEXT NOT NULL UNIQUE,
  status devis_status NOT NULL DEFAULT 'brouillon',
  payment_mode payment_mode NOT NULL DEFAULT 'financement',
  payment_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  report_type report_type,
  financing_months INTEGER,
  deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  monthly_payment NUMERIC(12,2),
  pdf_url TEXT,
  legal_mentions TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_devis_simulation ON devis(simulation_id);
CREATE INDEX idx_devis_status ON devis(status);

CREATE TRIGGER set_devis_updated_at
  BEFORE UPDATE ON devis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate devis number
CREATE OR REPLACE FUNCTION generate_devis_number()
RETURNS TEXT AS $$
DECLARE
  seq_val INTEGER;
  year_str TEXT;
BEGIN
  seq_val := nextval('devis_number_seq');
  year_str := to_char(now(), 'YYYY');
  RETURN 'DEV-' || year_str || '-' || lpad(seq_val::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  doc_type document_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  status document_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_client ON documents(client_id);
