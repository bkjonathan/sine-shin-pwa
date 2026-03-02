-- =============================================================
-- Supabase Migration: UUID primary keys + local_id sync mapping
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Rebuild schema so UUID primary keys are guaranteed even on existing projects.
DROP TABLE IF EXISTS sync_log CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS shop_settings CASCADE;

-- =============================================================
-- TABLES
-- =============================================================
CREATE TABLE IF NOT EXISTS shop_settings (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id BIGINT UNIQUE NOT NULL,
  shop_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_path TEXT,
  logo_cloud_url TEXT,
  customer_id_prefix TEXT DEFAULT 'SSC-',
  order_id_prefix TEXT DEFAULT 'SSO-',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_from_device_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS users (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_from_device_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS customers (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id BIGINT UNIQUE NOT NULL,
  customer_id TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  social_media_url TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_from_device_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS orders (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id BIGINT UNIQUE NOT NULL,
  order_id TEXT,
  customer_id BIGINT,
  status TEXT DEFAULT 'pending',
  order_from TEXT,
  exchange_rate DOUBLE PRECISION,
  shipping_fee DOUBLE PRECISION,
  delivery_fee DOUBLE PRECISION,
  cargo_fee DOUBLE PRECISION,
  order_date TIMESTAMPTZ,
  arrived_date TIMESTAMPTZ,
  shipment_date TIMESTAMPTZ,
  user_withdraw_date TIMESTAMPTZ,
  service_fee DOUBLE PRECISION,
  product_discount DOUBLE PRECISION DEFAULT 0,
  service_fee_type TEXT,
  shipping_fee_paid BOOLEAN DEFAULT FALSE,
  delivery_fee_paid BOOLEAN DEFAULT FALSE,
  cargo_fee_paid BOOLEAN DEFAULT FALSE,
  service_fee_paid BOOLEAN DEFAULT FALSE,
  shipping_fee_by_shop BOOLEAN DEFAULT FALSE,
  delivery_fee_by_shop BOOLEAN DEFAULT FALSE,
  cargo_fee_by_shop BOOLEAN DEFAULT FALSE,
  exclude_cargo_fee BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_from_device_at TIMESTAMPTZ,
  CONSTRAINT orders_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(local_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id BIGINT UNIQUE NOT NULL,
  order_id BIGINT,
  product_url TEXT,
  product_qty INTEGER,
  price DOUBLE PRECISION,
  product_weight DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_from_device_at TIMESTAMPTZ,
  CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(local_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id BIGINT UNIQUE NOT NULL,
  expense_id TEXT,
  title TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL CHECK(amount >= 0),
  category TEXT,
  payment_method TEXT,
  notes TEXT,
  expense_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_from_device_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sync_log (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_uuid UUID,
  local_id BIGINT,
  payload JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_shop_settings_local_id ON shop_settings(local_id);
CREATE INDEX IF NOT EXISTS idx_users_local_id ON users(local_id);
CREATE INDEX IF NOT EXISTS idx_customers_local_id ON customers(local_id);
CREATE INDEX IF NOT EXISTS idx_orders_local_id ON orders(local_id);
CREATE INDEX IF NOT EXISTS idx_order_items_local_id ON order_items(local_id);
CREATE INDEX IF NOT EXISTS idx_expenses_local_id ON expenses(local_id);

CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_updated_at ON order_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_order_items_deleted_at ON order_items(deleted_at);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_updated_at ON expenses(updated_at);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Authenticated users read users" ON users;
DROP POLICY IF EXISTS "Authenticated users read customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users read order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users read expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users read sync_log" ON sync_log;

DROP POLICY IF EXISTS "Authenticated users manage shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Authenticated users manage users" ON users;
DROP POLICY IF EXISTS "Authenticated users manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users manage orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users manage order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users manage expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users manage sync_log" ON sync_log;

DROP POLICY IF EXISTS "Service role manage shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Service role manage users" ON users;
DROP POLICY IF EXISTS "Service role manage customers" ON customers;
DROP POLICY IF EXISTS "Service role manage orders" ON orders;
DROP POLICY IF EXISTS "Service role manage order_items" ON order_items;
DROP POLICY IF EXISTS "Service role manage expenses" ON expenses;
DROP POLICY IF EXISTS "Service role manage sync_log" ON sync_log;

DROP POLICY IF EXISTS "Anon manage shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Anon manage users" ON users;
DROP POLICY IF EXISTS "Anon manage customers" ON customers;
DROP POLICY IF EXISTS "Anon manage orders" ON orders;
DROP POLICY IF EXISTS "Anon manage order_items" ON order_items;
DROP POLICY IF EXISTS "Anon manage expenses" ON expenses;
DROP POLICY IF EXISTS "Anon manage sync_log" ON sync_log;

CREATE POLICY "Authenticated users read shop_settings" ON shop_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read order_items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read sync_log" ON sync_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manage shop_settings" ON shop_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage customers" ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage orders" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage order_items" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage expenses" ON expenses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manage sync_log" ON sync_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon manage shop_settings" ON shop_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage customers" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage orders" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage order_items" ON order_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage expenses" ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon manage sync_log" ON sync_log FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================================
-- DASHBOARD RPC
-- =============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_date_field TEXT DEFAULT 'order_date',
  p_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_revenue DOUBLE PRECISION := 0;
  v_total_profit DOUBLE PRECISION := 0;
  v_total_orders BIGINT := 0;
  v_total_customers BIGINT := 0;
  v_total_cargo_fee DOUBLE PRECISION := 0;
  v_recent_orders JSON := '[]'::json;

  v_cond TEXT := '1=1';
  v_cond_o TEXT := '1=1';
  v_date_col TEXT := 'order_date';
BEGIN
  IF p_date_field = 'created_at' THEN
    v_date_col := 'created_at';
  ELSE
    v_date_col := 'order_date';
  END IF;

  IF p_date_from IS NOT NULL AND p_date_to IS NOT NULL THEN
    v_cond := format('%s >= %L AND %s <= %L', v_date_col, p_date_from, v_date_col, p_date_to);
    v_cond_o := format('o.%s >= %L AND o.%s <= %L', v_date_col, p_date_from, v_date_col, p_date_to);
  END IF;

  IF p_status IS NOT NULL THEN
    v_cond := v_cond || format(' AND status = %L', p_status);
    v_cond_o := v_cond_o || format(' AND o.status = %L', p_status);
  END IF;

  v_cond := v_cond || ' AND deleted_at IS NULL';
  v_cond_o := v_cond_o || ' AND o.deleted_at IS NULL';

  EXECUTE format('
    SELECT COALESCE(SUM(oi.price * oi.product_qty), 0.0)
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.local_id
    WHERE %s AND oi.deleted_at IS NULL
  ', v_cond_o) INTO v_total_revenue;

  EXECUTE format('
    SELECT COALESCE(SUM(
      CASE
        WHEN service_fee_type = ''percent'' THEN
          (SELECT COALESCE(SUM(price * product_qty), 0)
           FROM order_items
           WHERE order_id = orders.local_id AND deleted_at IS NULL) * (COALESCE(service_fee, 0) / 100.0)
        ELSE
          COALESCE(service_fee, 0)
      END
      - COALESCE(product_discount, 0)
      - CASE WHEN shipping_fee_by_shop = TRUE THEN COALESCE(shipping_fee, 0) ELSE 0 END
      - CASE WHEN delivery_fee_by_shop = TRUE THEN COALESCE(delivery_fee, 0) ELSE 0 END
      - CASE WHEN cargo_fee_by_shop = TRUE AND exclude_cargo_fee != TRUE THEN COALESCE(cargo_fee, 0) ELSE 0 END
    ), 0.0)
    FROM orders
    WHERE %s
  ', v_cond) INTO v_total_profit;

  EXECUTE format('SELECT COUNT(*) FROM orders WHERE %s', v_cond) INTO v_total_orders;
  EXECUTE format('SELECT COUNT(DISTINCT customer_id) FROM orders WHERE %s', v_cond) INTO v_total_customers;
  EXECUTE format('SELECT COALESCE(SUM(CASE WHEN exclude_cargo_fee != TRUE THEN COALESCE(cargo_fee, 0) ELSE 0 END), 0.0) FROM orders WHERE %s', v_cond) INTO v_total_cargo_fee;

  EXECUTE format('
    SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json) FROM (
      SELECT
        o.local_id AS id,
        o.order_id,
        o.customer_id,
        c.name AS customer_name,
        COALESCE((SELECT SUM(oi.price * oi.product_qty)
                  FROM order_items oi
                  WHERE oi.order_id = o.local_id AND oi.deleted_at IS NULL), 0) AS total_price,
        o.created_at,
        (SELECT oi.product_url
         FROM order_items oi
         WHERE oi.order_id = o.local_id AND oi.deleted_at IS NULL
         LIMIT 1) AS first_product_url,
        COALESCE(o.service_fee, 0) AS service_fee,
        COALESCE(o.service_fee_type, ''fixed'') AS service_fee_type
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.local_id
      WHERE %s
      ORDER BY o.created_at DESC
      LIMIT 5
    ) t
  ', v_cond_o) INTO v_recent_orders;

  RETURN json_build_object(
    'total_revenue', v_total_revenue,
    'total_profit', v_total_profit,
    'total_cargo_fee', v_total_cargo_fee,
    'total_orders', v_total_orders,
    'total_customers', v_total_customers,
    'recent_orders', v_recent_orders
  );
END;
$$;
