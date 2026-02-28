export interface ShopSettings {
  id: number;
  shop_name: string;
  phone: string | null;
  address: string | null;
  logo_path: string | null;
  customer_id_prefix: string | null;
  order_id_prefix: string | null;
  created_at: string | null;
  updated_at: string | null;
  synced_from_device_at: string | null;
}

export interface User {
  id: number;
  name: string;
  password_hash: string;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
  synced_from_device_at: string | null;
}

export interface Customer {
  id: number;
  customer_id: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  social_media_url: string | null;
  platform: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  synced_from_device_at: string | null;
}

export interface Order {
  id: number;
  order_id: string | null;
  customer_id: number | null;
  status: string | null;
  order_from: string | null;
  exchange_rate: number | null;
  shipping_fee: number | null;
  delivery_fee: number | null;
  cargo_fee: number | null;
  order_date: string | null;
  arrived_date: string | null;
  shipment_date: string | null;
  user_withdraw_date: string | null;
  service_fee: number | null;
  product_discount: number | null;
  service_fee_type: string | null;
  shipping_fee_paid: boolean | null;
  delivery_fee_paid: boolean | null;
  cargo_fee_paid: boolean | null;
  service_fee_paid: boolean | null;
  shipping_fee_by_shop: boolean | null;
  delivery_fee_by_shop: boolean | null;
  cargo_fee_by_shop: boolean | null;
  exclude_cargo_fee: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  synced_from_device_at: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number | null;
  product_url: string | null;
  product_qty: number | null;
  price: number | null;
  product_weight: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  synced_from_device_at: string | null;
}

export interface Expense {
  id: number;
  expense_id: string | null;
  title: string;
  amount: number;
  category: string | null;
  payment_method: string | null;
  notes: string | null;
  expense_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  synced_from_device_at: string | null;
}

export interface SyncLog {
  id: number;
  table_name: string | null;
  operation: string | null;
  record_id: number | null;
  received_at: string | null;
}

export interface ShopData {
  shop_name: string;
  phone: string | null;
  address: string | null;
  logo_path: string | null;
  customer_id_prefix: string | null;
}

export interface DashboardOrder {
  id: number;
  order_id: string | null;
  customer_id: number | null;
  customer_name: string | null;
  total_price: number;
  created_at: string | null;
  first_product_url: string | null;
  service_fee: number;
  service_fee_type: string;
}

export interface DashboardStats {
  total_revenue: number;
  total_profit: number;
  total_cargo_fee: number;
  total_orders: number;
  total_customers: number;
  recent_orders: DashboardOrder[];
}
