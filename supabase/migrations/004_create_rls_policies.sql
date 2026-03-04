-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpr_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpr_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cee_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE complementary_products ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user manages a given commercial
CREATE OR REPLACE FUNCTION manages_user(target_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = target_id AND manager_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==================== PROFILES ====================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Managers can view their team"
  ON profiles FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "Users can update own profile limited fields"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ==================== CLIENTS ====================

CREATE POLICY "Commercial sees own clients"
  ON clients FOR SELECT
  USING (commercial_id = auth.uid());

CREATE POLICY "Managers see team clients"
  ON clients FOR SELECT
  USING (manages_user(commercial_id));

CREATE POLICY "Admins see all clients"
  ON clients FOR SELECT
  USING (is_admin());

CREATE POLICY "Commercial creates clients"
  ON clients FOR INSERT
  WITH CHECK (commercial_id = auth.uid());

CREATE POLICY "Commercial updates own clients"
  ON clients FOR UPDATE
  USING (commercial_id = auth.uid());

CREATE POLICY "Admins manage all clients"
  ON clients FOR ALL
  USING (is_admin());

-- ==================== SIMULATIONS ====================

CREATE POLICY "Commercial sees own simulations"
  ON simulations FOR SELECT
  USING (commercial_id = auth.uid());

CREATE POLICY "Managers see team simulations"
  ON simulations FOR SELECT
  USING (manages_user(commercial_id));

CREATE POLICY "Admins see all simulations"
  ON simulations FOR SELECT
  USING (is_admin());

CREATE POLICY "Commercial creates simulations"
  ON simulations FOR INSERT
  WITH CHECK (commercial_id = auth.uid());

CREATE POLICY "Commercial updates own simulations"
  ON simulations FOR UPDATE
  USING (commercial_id = auth.uid());

CREATE POLICY "Admins manage all simulations"
  ON simulations FOR ALL
  USING (is_admin());

-- ==================== SIMULATION PRODUCTS ====================

CREATE POLICY "View simulation products via simulation access"
  ON simulation_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM simulations s
      WHERE s.id = simulation_id
      AND (s.commercial_id = auth.uid() OR manages_user(s.commercial_id) OR is_admin())
    )
  );

CREATE POLICY "Manage simulation products for own simulations"
  ON simulation_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM simulations s
      WHERE s.id = simulation_id
      AND (s.commercial_id = auth.uid() OR is_admin())
    )
  );

-- ==================== DEVIS ====================

CREATE POLICY "View devis via simulation access"
  ON devis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM simulations s
      WHERE s.id = simulation_id
      AND (s.commercial_id = auth.uid() OR manages_user(s.commercial_id) OR is_admin())
    )
  );

CREATE POLICY "Manage devis for own simulations"
  ON devis FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM simulations s
      WHERE s.id = simulation_id
      AND (s.commercial_id = auth.uid() OR is_admin())
    )
  );

-- ==================== DOCUMENTS ====================

CREATE POLICY "View documents via client access"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_id
      AND (c.commercial_id = auth.uid() OR manages_user(c.commercial_id) OR is_admin())
    )
  );

CREATE POLICY "Manage documents for own clients"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_id
      AND (c.commercial_id = auth.uid() OR is_admin())
    )
  );

-- ==================== ADMIN TABLES (read: all auth, write: admin only) ====================

-- Sale prices
CREATE POLICY "All authenticated read sale prices"
  ON sale_prices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage sale prices"
  ON sale_prices FOR ALL
  USING (is_admin());

-- MPR thresholds
CREATE POLICY "All authenticated read mpr thresholds"
  ON mpr_thresholds FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage mpr thresholds"
  ON mpr_thresholds FOR ALL
  USING (is_admin());

-- MPR rates
CREATE POLICY "All authenticated read mpr rates"
  ON mpr_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage mpr rates"
  ON mpr_rates FOR ALL
  USING (is_admin());

-- CEE rates
CREATE POLICY "All authenticated read cee rates"
  ON cee_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage cee rates"
  ON cee_rates FOR ALL
  USING (is_admin());

-- Credit rates
CREATE POLICY "All authenticated read credit rates"
  ON credit_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage credit rates"
  ON credit_rates FOR ALL
  USING (is_admin());

-- Construction costs (ADMIN ONLY - no read for non-admins)
CREATE POLICY "Only admins access construction costs"
  ON construction_costs FOR ALL
  USING (is_admin());

-- Complementary products
CREATE POLICY "All authenticated read complementary products"
  ON complementary_products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage complementary products"
  ON complementary_products FOR ALL
  USING (is_admin());
