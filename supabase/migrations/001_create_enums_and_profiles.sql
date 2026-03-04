-- Custom enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'commercial');
CREATE TYPE mpr_client_type AS ENUM ('bleu', 'jaune', 'violet', 'rose');
CREATE TYPE sheet_type AS ENUM ('acier', 'alu');
CREATE TYPE simulation_status AS ENUM ('brouillon', 'devis_envoye', 'accepte', 'refuse', 'expire');
CREATE TYPE devis_status AS ENUM ('brouillon', 'envoye', 'accepte', 'refuse', 'expire');
CREATE TYPE payment_mode AS ENUM ('comptant', 'multipaiement', 'financement', 'cheque', 'especes');
CREATE TYPE report_type AS ENUM ('30j', '90j');
CREATE TYPE document_type AS ENUM ('identity', 'tax_notice', 'property_tax', 'payslips', 'rib', 'edf_invoice');
CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE product_category AS ENUM ('chauffe_eau', 'gouttiere', 'faux_plafond', 'bois', 'autre');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'commercial',
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_manager ON profiles(manager_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'commercial')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
