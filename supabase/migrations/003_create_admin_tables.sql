-- Sale prices (admin-managed roofing tariffs)
CREATE TABLE sale_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  price_per_m2 NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TRIGGER set_sale_prices_updated_at
  BEFORE UPDATE ON sale_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default sale prices from Excel
INSERT INTO sale_prices (label, price_per_m2) VALUES
  ('toles_acier', 149),
  ('toles_alu', 159),
  ('charpente_toles_acier', 249),
  ('charpente_toles_alu', 269);

-- MPR thresholds (income limits per household size)
CREATE TABLE mpr_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persons_count INTEGER NOT NULL UNIQUE,
  threshold_bleu NUMERIC(12,2) NOT NULL,
  threshold_jaune NUMERIC(12,2) NOT NULL,
  threshold_violet NUMERIC(12,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_mpr_thresholds_updated_at
  BEFORE UPDATE ON mpr_thresholds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed from Excel Barème aides sheet (Martinique plafonds)
INSERT INTO mpr_thresholds (persons_count, threshold_bleu, threshold_jaune, threshold_violet) VALUES
  (1, 17009, 21805, 30549),
  (2, 24875, 31889, 44907),
  (3, 29917, 38349, 54071),
  (4, 34948, 44802, 63235),
  (5, 40002, 51281, 72400),
  (6, 44387, 56898, 80290);

-- MPR rates (subsidies per m2 by operation and client type)
CREATE TABLE mpr_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL UNIQUE,
  bleu NUMERIC(10,2) NOT NULL DEFAULT 0,
  jaune NUMERIC(10,2) NOT NULL DEFAULT 0,
  violet NUMERIC(10,2) NOT NULL DEFAULT 0,
  rose NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_mpr_rates_updated_at
  BEFORE UPDATE ON mpr_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed from Excel
INSERT INTO mpr_rates (operation, bleu, jaune, violet, rose) VALUES
  ('bar_en_106', 25, 20, 15, 0),
  ('bar_en_109', 25, 20, 15, 0);

-- CEE rates (per m2 by operation and client type)
CREATE TABLE cee_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL UNIQUE,
  bleu NUMERIC(10,2) NOT NULL DEFAULT 0,
  jaune NUMERIC(10,2) NOT NULL DEFAULT 0,
  violet NUMERIC(10,2) NOT NULL DEFAULT 0,
  rose NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_cee_rates_updated_at
  BEFORE UPDATE ON cee_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed from Excel
INSERT INTO cee_rates (operation, bleu, jaune, violet, rose) VALUES
  ('bar_en_106', 16, 15, 12, 12),
  ('bar_en_109', 16, 14, 14, 14);

-- Credit rates (monthly factor by report type and duration)
CREATE TABLE credit_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type report_type NOT NULL,
  months INTEGER NOT NULL,
  rate NUMERIC(10,6) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_type, months)
);

CREATE TRIGGER set_credit_rates_updated_at
  BEFORE UPDATE ON credit_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed from Excel (Tx credit moderne sheet)
INSERT INTO credit_rates (report_type, months, rate) VALUES
  ('30j', 10, 0.103862),
  ('30j', 12, 0.090092),
  ('30j', 18, 0.061300),
  ('30j', 24, 0.047211),
  ('30j', 36, 0.032884),
  ('30j', 48, 0.025786),
  ('30j', 60, 0.021582),
  ('30j', 72, 0.017954),
  ('30j', 84, 0.015909),
  ('30j', 96, 0.014482),
  ('30j', 108, 0.013250),
  ('30j', 120, 0.013250),
  ('30j', 132, 0.012481),
  ('30j', 144, 0.011850),
  ('30j', 156, 0.011321),
  ('30j', 168, 0.010876),
  ('30j', 180, 0.010496),
  ('90j', 10, 0.105296),
  ('90j', 12, 0.091335),
  ('90j', 18, 0.062145),
  ('90j', 24, 0.047863),
  ('90j', 36, 0.033339),
  ('90j', 48, 0.026142),
  ('90j', 60, 0.021880),
  ('90j', 72, 0.019040),
  ('90j', 84, 0.017011),
  ('90j', 96, 0.015610),
  ('90j', 108, 0.014394),
  ('90j', 120, 0.013431),
  ('90j', 132, 0.012652),
  ('90j', 144, 0.012012),
  ('90j', 156, 0.011476),
  ('90j', 168, 0.011024),
  ('90j', 180, 0.010639);

-- Construction costs (admin-only visibility)
CREATE TABLE construction_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  price_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  tva_rate NUMERIC(5,2) NOT NULL DEFAULT 2.1,
  category TEXT NOT NULL DEFAULT 'materiau',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_construction_costs_updated_at
  BEFORE UPDATE ON construction_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed from Excel COÛT CHANTIER
INSERT INTO construction_costs (label, price_per_unit, tva_rate, category) VALUES
  ('pose', 25, 2.1, 'main_oeuvre'),
  ('charpente_bois_surtoiture', 5, 2.1, 'materiau'),
  ('charpente_complete', 0, 2.1, 'materiau'),
  ('tole', 25, 2.1, 'materiau'),
  ('isolant_106', 7, 0, 'materiau'),
  ('isolant_109', 7, 0, 'materiau'),
  ('commission_commerciale', 0.2, 8.5, 'logistique'),
  ('back_office', 300, 0, 'logistique'),
  ('transport', 350, 8.5, 'logistique'),
  ('metrage_controle', 0, 0, 'logistique');

-- Seed complementary products from Excel
INSERT INTO complementary_products (name, category, unit_price_sell, unit_price_cost, tva_rate, unit_label, sort_order) VALUES
  ('Dépose et repose du chauffe-eau solaire', 'chauffe_eau', 350, 350, 2.1, 'unité', 1),
  ('Liteaunage 70x55', 'bois', 30, 30, 2.1, 'unité', 2),
  ('Empannage classe 4 pin 8x8', 'bois', 50, 50, 2.1, 'unité', 3),
  ('Charpente 2 pans ou 4 pans', 'bois', 109, 109, 2.1, 'unité', 4),
  ('Étanchéité de chenaux', 'gouttiere', 80, 25, 2.1, 'ml', 5),
  ('Suppression des chenaux', 'gouttiere', 120, 120, 2.1, 'ml', 6),
  ('Gouttière aluminium (crochet ou planche de rive)', 'gouttiere', 25, 29, 2.1, 'ml', 7),
  ('Descente gouttière d''eau', 'gouttiere', 29, 29, 2.1, 'ml', 8),
  ('Forfait planche de rive / Faîtières', 'gouttiere', 30, 30, 2.1, 'unité', 9),
  ('Faux plafond PVC + Structure : pose et fourniture', 'faux_plafond', 79, 79, 2.1, 'm²', 10);
