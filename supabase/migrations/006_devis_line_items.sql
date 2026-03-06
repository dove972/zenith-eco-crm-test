-- ============================================================
-- Migration 006 : Lignes de devis administrables
-- Ajoute les colonnes nécessaires à complementary_products
-- pour y stocker les lignes de devis (actuellement hardcodées)
-- ============================================================

-- 1. Ajouter les valeurs manquantes à l'enum product_category
-- (8 valeurs présentes dans le TypeScript mais absentes de la DB)
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'electricite';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'plomberie';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'peinture';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'etancheite';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'ventilation';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'securite';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'nettoyage';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'accessoires';
-- 5 nouvelles catégories pour les lignes de devis
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'toiture';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'main_oeuvre';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'isolation';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'logistique';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'etude';

-- 2. Ajouter les nouvelles colonnes à complementary_products
ALTER TABLE complementary_products
  ADD COLUMN IF NOT EXISTS is_devis_line BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS devis_line_key TEXT,
  ADD COLUMN IF NOT EXISTS quantity_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (quantity_mode IN ('manual', 'fixed', 'surface')),
  ADD COLUMN IF NOT EXISTS inclusion_condition TEXT
    CHECK (inclusion_condition IN ('always', 'needs_framework', 'eligible_109', 'eligible_106')),
  ADD COLUMN IF NOT EXISTS devis_group TEXT,
  ADD COLUMN IF NOT EXISTS sheet_type_variant sheet_type;

-- 3. Index pour requêtes rapides sur les lignes de devis
CREATE INDEX IF NOT EXISTS idx_complementary_products_is_devis_line
  ON complementary_products(is_devis_line) WHERE is_devis_line = true;

-- 4. Insérer les 12 lignes de devis
-- sort_order 101-112 pour séparer des produits annexes existants (1-10)

INSERT INTO complementary_products (
  name, category, unit_price_sell, unit_price_cost, tva_rate,
  unit_label, sort_order, active,
  is_devis_line, devis_line_key, quantity_mode, inclusion_condition,
  devis_group, sheet_type_variant
) VALUES
-- ─── Groupe : Prévisite et étude technique ───
(
  'Prévisite & contrôle de chantier',
  'etude', 250, 0, 2.1,
  'unité', 101, true,
  true, 'previsite', 'fixed', 'always',
  'Prévisite et étude technique', NULL
),
(
  'Frais d''étude technique par maître d''œuvre',
  'etude', 499, 0, 2.1,
  'unité', 102, true,
  true, 'etude_technique', 'fixed', 'always',
  'Prévisite et étude technique', NULL
),

-- ─── Groupe : Travaux Toiture ───
(
  'Fournitures de tôles ACIER + accessoires',
  'toiture', 49, 0, 2.1,
  'm²', 103, true,
  true, 'tole', 'surface', 'always',
  'Travaux Toiture', 'acier'
),
(
  'Fournitures de tôles ALU + accessoires',
  'toiture', 59, 0, 2.1,
  'm²', 104, true,
  true, 'tole', 'surface', 'always',
  'Travaux Toiture', 'alu'
),
(
  'Main d''œuvre changement de tôle',
  'main_oeuvre', 59, 0, 2.1,
  'm²', 105, true,
  true, 'mo_tole', 'surface', 'always',
  'Travaux Toiture', NULL
),
(
  'Livraison tôles et accessoires',
  'logistique', 350, 0, 2.1,
  'unité', 106, true,
  true, 'livraison_toles', 'fixed', 'always',
  'Travaux Toiture', NULL
),

-- ─── Groupe : Charpente ───
(
  'Achat bois charpente',
  'bois', 30, 0, 2.1,
  'm²', 107, true,
  true, 'bois_charpente', 'surface', 'needs_framework',
  'Charpente', NULL
),
(
  'Main d''œuvre confection de charpente',
  'main_oeuvre', 40, 0, 2.1,
  'm²', 108, true,
  true, 'mo_charpente', 'surface', 'needs_framework',
  'Charpente', NULL
),

-- ─── Groupe : Protection parois opaques BAR-EN-109 ───
(
  'Réduction apports solaires toiture - THERMOBULLE',
  'isolation', 19, 0, 0,
  'm²', 109, true,
  true, 'isolant_109_materiau', 'surface', 'eligible_109',
  'Protection parois opaques BAR-EN-109', NULL
),
(
  'Livraison et mise en place isolant THERMOBULLE',
  'isolation', 19, 0, 2.1,
  'm²', 110, true,
  true, 'isolant_109_pose', 'surface', 'eligible_109',
  'Protection parois opaques BAR-EN-109', NULL
),

-- ─── Groupe : Installation rampants BAR-EN-106 ───
(
  'Isolation toiture en pente - URSA MRA 40',
  'isolation', 19, 0, 0,
  'm²', 111, true,
  true, 'isolant_106_materiau', 'surface', 'eligible_106',
  'Installation rampants BAR-EN-106', NULL
),
(
  'Livraison et mise en place isolation URSA MRA 40',
  'isolation', 19, 0, 2.1,
  'm²', 112, true,
  true, 'isolant_106_pose', 'surface', 'eligible_106',
  'Installation rampants BAR-EN-106', NULL
);
