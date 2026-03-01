-- =============================================================
-- Supabase Migration: Dashboard Stats RPC Function
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
  -- Determine date column safely
  IF p_date_field = 'created_at' THEN
    v_date_col := 'created_at';
  ELSE
    v_date_col := 'order_date';
  END IF;

  -- Date condition
  IF p_date_from IS NOT NULL AND p_date_to IS NOT NULL THEN
    v_cond := format('%s >= %L AND %s <= %L', v_date_col, p_date_from, v_date_col, p_date_to);
    v_cond_o := format('o.%s >= %L AND o.%s <= %L', v_date_col, p_date_from, v_date_col, p_date_to);
  END IF;

  -- Status condition
  IF p_status IS NOT NULL THEN
    v_cond := v_cond || format(' AND status = %L', p_status);
    v_cond_o := v_cond_o || format(' AND o.status = %L', p_status);
  END IF;
  
  v_cond := v_cond || ' AND deleted_at IS NULL';
  v_cond_o := v_cond_o || ' AND o.deleted_at IS NULL';

  -- 1) Total revenue
  EXECUTE format('
    SELECT COALESCE(SUM(oi.price * oi.product_qty), 0.0) 
    FROM order_items oi 
    INNER JOIN orders o ON oi.order_id = o.id 
    WHERE %s AND oi.deleted_at IS NULL
  ', v_cond_o) INTO v_total_revenue;

  -- 2) Total profit
  EXECUTE format('
    SELECT COALESCE(SUM(
        CASE 
            WHEN service_fee_type = ''percent'' THEN 
                (SELECT COALESCE(SUM(price * product_qty), 0) FROM order_items WHERE order_id = orders.id AND deleted_at IS NULL) * (COALESCE(service_fee, 0) / 100.0)
            ELSE 
                COALESCE(service_fee, 0)
        END
        - COALESCE(product_discount, 0)
        - CASE WHEN shipping_fee_by_shop = TRUE THEN COALESCE(shipping_fee, 0) ELSE 0 END
        - CASE WHEN delivery_fee_by_shop = TRUE THEN COALESCE(delivery_fee, 0) ELSE 0 END
        - CASE WHEN cargo_fee_by_shop = TRUE AND exclude_cargo_fee != TRUE  THEN COALESCE(cargo_fee, 0) ELSE 0 END
    ), 0.0)
    FROM orders 
    WHERE %s
  ', v_cond) INTO v_total_profit;

  -- 3) Total orders
  EXECUTE format('SELECT COUNT(*) FROM orders WHERE %s', v_cond) INTO v_total_orders;

  -- 4) Total customers
  EXECUTE format('SELECT COUNT(DISTINCT customer_id) FROM orders WHERE %s', v_cond) INTO v_total_customers;

  -- 5) Total cargo fee
  EXECUTE format('SELECT COALESCE(SUM(CASE WHEN exclude_cargo_fee != TRUE THEN COALESCE(cargo_fee, 0) ELSE 0 END), 0.0) FROM orders WHERE %s', v_cond) INTO v_total_cargo_fee;

  -- 6) Recent orders
  EXECUTE format('
    SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json) FROM (
      SELECT 
        o.id, 
        o.order_id, 
        o.customer_id, 
        c.name as customer_name,
        COALESCE((SELECT SUM(oi.price * oi.product_qty) FROM order_items oi WHERE oi.order_id = o.id AND oi.deleted_at IS NULL), 0) as total_price,
        o.created_at,
        (SELECT oi.product_url FROM order_items oi WHERE oi.order_id = o.id AND oi.deleted_at IS NULL LIMIT 1) as first_product_url,
        COALESCE(o.service_fee, 0) as service_fee,
        o.service_fee_type
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
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
