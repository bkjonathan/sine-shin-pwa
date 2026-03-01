import type { OrderItem } from "@/types/database";
import type { OrderWithItems } from "@/services/orders.service";

export interface OrderItemFormState {
  id?: number;
  key: string;
  product_url: string;
  product_qty: string;
  price: string;
  product_weight: string;
}

export interface OrderFormState {
  order_id: string;
  customer_id: string;
  status: string;
  order_from: string;
  exchange_rate: string;
  shipping_fee: string;
  delivery_fee: string;
  cargo_fee: string;
  order_date: string;
  arrived_date: string;
  shipment_date: string;
  user_withdraw_date: string;
  service_fee: string;
  product_discount: string;
  service_fee_type: string;
  shipping_fee_paid: boolean;
  delivery_fee_paid: boolean;
  cargo_fee_paid: boolean;
  service_fee_paid: boolean;
  shipping_fee_by_shop: boolean;
  delivery_fee_by_shop: boolean;
  cargo_fee_by_shop: boolean;
  exclude_cargo_fee: boolean;
}

export const emptyOrderForm: OrderFormState = {
  order_id: "",
  customer_id: "",
  status: "pending",
  order_from: "",
  exchange_rate: "",
  shipping_fee: "",
  delivery_fee: "",
  cargo_fee: "",
  order_date: "",
  arrived_date: "",
  shipment_date: "",
  user_withdraw_date: "",
  service_fee: "",
  product_discount: "",
  service_fee_type: "fixed",
  shipping_fee_paid: false,
  delivery_fee_paid: false,
  cargo_fee_paid: false,
  service_fee_paid: false,
  shipping_fee_by_shop: false,
  delivery_fee_by_shop: false,
  cargo_fee_by_shop: false,
  exclude_cargo_fee: false,
};

const makeItemKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const toInputDate = (value: string | null): string => {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
};

export const createEmptyItem = (): OrderItemFormState => ({
  key: makeItemKey(),
  product_url: "",
  product_qty: "",
  price: "",
  product_weight: "",
});

export const toNullableString = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const toNullableNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

export const toNullableInt = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const toNullableIsoDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return new Date(`${trimmed}T00:00:00`).toISOString();
};

export const hasItemValue = (item: OrderItemFormState) =>
  item.product_url.trim() ||
  item.product_qty.trim() ||
  item.price.trim() ||
  item.product_weight.trim();

export const mapOrderItemToForm = (item: OrderItem): OrderItemFormState => ({
  id: item.id,
  key: item.id.toString(),
  product_url: item.product_url ?? "",
  product_qty: item.product_qty?.toString() ?? "",
  price: item.price?.toString() ?? "",
  product_weight: item.product_weight?.toString() ?? "",
});

export const mapOrderToForm = (order: OrderWithItems) => ({
  form: {
    order_id: order.order_id ?? "",
    customer_id: order.customer_id?.toString() ?? "",
    status: order.status ?? "pending",
    order_from: order.order_from ?? "",
    exchange_rate: order.exchange_rate?.toString() ?? "",
    shipping_fee: order.shipping_fee?.toString() ?? "",
    delivery_fee: order.delivery_fee?.toString() ?? "",
    cargo_fee: order.cargo_fee?.toString() ?? "",
    order_date: toInputDate(order.order_date),
    arrived_date: toInputDate(order.arrived_date),
    shipment_date: toInputDate(order.shipment_date),
    user_withdraw_date: toInputDate(order.user_withdraw_date),
    service_fee: order.service_fee?.toString() ?? "",
    product_discount: order.product_discount?.toString() ?? "",
    service_fee_type: order.service_fee_type ?? "fixed",
    shipping_fee_paid: order.shipping_fee_paid ?? false,
    delivery_fee_paid: order.delivery_fee_paid ?? false,
    cargo_fee_paid: order.cargo_fee_paid ?? false,
    service_fee_paid: order.service_fee_paid ?? false,
    shipping_fee_by_shop: order.shipping_fee_by_shop ?? false,
    delivery_fee_by_shop: order.delivery_fee_by_shop ?? false,
    cargo_fee_by_shop: order.cargo_fee_by_shop ?? false,
    exclude_cargo_fee: order.exclude_cargo_fee ?? false,
  } satisfies OrderFormState,
  itemForms: order.order_items.length
    ? order.order_items.map(mapOrderItemToForm)
    : [createEmptyItem()],
});

export const calculateOrderTotal = (order: OrderWithItems): number => {
  const itemSum = order.order_items.reduce((sum, item) => {
    const qty = item.product_qty ?? 1;
    const price = item.price ?? 0;
    return sum + qty * price;
  }, 0);

  return (
    itemSum +
    (order.shipping_fee ?? 0) +
    (order.delivery_fee ?? 0) +
    (order.cargo_fee ?? 0) +
    (order.service_fee ?? 0) -
    (order.product_discount ?? 0)
  );
};
