import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { motion } from "framer-motion";
import { PackagePlus, Plus, RefreshCcw, Trash2, UserPen } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customersService } from "@/services/customers.service";
import {
  orderItemsService,
  ordersService,
  type OrderWithItems,
} from "@/services/orders.service";
import type { Customer, Order, OrderItem } from "@/types/database";

interface OrderItemFormState {
  id?: number;
  key: string;
  product_url: string;
  product_qty: string;
  price: string;
  product_weight: string;
}

interface OrderFormState {
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

const emptyOrderForm: OrderFormState = {
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

const createEmptyItem = (): OrderItemFormState => ({
  key: makeItemKey(),
  product_url: "",
  product_qty: "",
  price: "",
  product_weight: "",
});

const toNullableString = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toNullableNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const toNullableInt = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toNullableIsoDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return new Date(`${trimmed}T00:00:00`).toISOString();
};

const toInputDate = (value: string | null): string => {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
};

const hasItemValue = (item: OrderItemFormState) =>
  item.product_url.trim() ||
  item.product_qty.trim() ||
  item.price.trim() ||
  item.product_weight.trim();

const mapOrderItemToForm = (item: OrderItem): OrderItemFormState => ({
  id: item.id,
  key: item.id.toString(),
  product_url: item.product_url ?? "",
  product_qty: item.product_qty?.toString() ?? "",
  price: item.price?.toString() ?? "",
  product_weight: item.product_weight?.toString() ?? "",
});

const calculateOrderTotal = (order: OrderWithItems): number => {
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

export const OrdersPage = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<OrderFormState>(emptyOrderForm);
  const [itemForms, setItemForms] = useState<OrderItemFormState[]>([
    createEmptyItem(),
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [orderData, customerData] = await Promise.all([
        ordersService.getOrders(),
        customersService.getCustomers(),
      ]);
      setOrders(orderData);
      setCustomers(customerData);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyOrderForm);
    setItemForms([createEmptyItem()]);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setIsSaving(true);

    const orderPayload: Omit<
      Order,
      "id" | "created_at" | "updated_at" | "deleted_at"
    > = {
      order_id: toNullableString(form.order_id),
      customer_id: toNullableInt(form.customer_id),
      status: toNullableString(form.status),
      order_from: toNullableString(form.order_from),
      exchange_rate: toNullableNumber(form.exchange_rate),
      shipping_fee: toNullableNumber(form.shipping_fee),
      delivery_fee: toNullableNumber(form.delivery_fee),
      cargo_fee: toNullableNumber(form.cargo_fee),
      order_date: toNullableIsoDate(form.order_date),
      arrived_date: toNullableIsoDate(form.arrived_date),
      shipment_date: toNullableIsoDate(form.shipment_date),
      user_withdraw_date: toNullableIsoDate(form.user_withdraw_date),
      service_fee: toNullableNumber(form.service_fee),
      product_discount: toNullableNumber(form.product_discount),
      service_fee_type: toNullableString(form.service_fee_type),
      shipping_fee_paid: form.shipping_fee_paid,
      delivery_fee_paid: form.delivery_fee_paid,
      cargo_fee_paid: form.cargo_fee_paid,
      service_fee_paid: form.service_fee_paid,
      shipping_fee_by_shop: form.shipping_fee_by_shop,
      delivery_fee_by_shop: form.delivery_fee_by_shop,
      cargo_fee_by_shop: form.cargo_fee_by_shop,
      exclude_cargo_fee: form.exclude_cargo_fee,
      synced_from_device_at: null,
    };

    const itemsToProcess = itemForms.filter(hasItemValue).map((item) => ({
      id: item.id,
      product_url: toNullableString(item.product_url),
      product_qty: toNullableInt(item.product_qty),
      price: toNullableNumber(item.price),
      product_weight: toNullableNumber(item.product_weight),
      synced_from_device_at: null,
    }));

    try {
      if (editingId === null) {
        // Create new order and all items
        const itemPayloads = itemsToProcess.map(({ id, ...rest }) => rest);
        await ordersService.createOrder(orderPayload, itemPayloads);
      } else {
        await ordersService.updateOrder(editingId, orderPayload);

        const existingOrder = await ordersService.getOrderById(editingId);
        const existingItemIds =
          existingOrder?.order_items?.map((i) => i.id) || [];

        const currentItemIds = itemsToProcess
          .filter((i) => i.id !== undefined)
          .map((i) => i.id as number);

        // Items to delete
        const idsToDelete = existingItemIds.filter(
          (id) => !currentItemIds.includes(id),
        );
        if (idsToDelete.length) {
          await Promise.all(
            idsToDelete.map((id) => orderItemsService.deleteOrderItem(id)),
          );
        }

        // Items to update
        const itemsToUpdate = itemsToProcess.filter((i) => i.id !== undefined);
        if (itemsToUpdate.length) {
          await Promise.all(
            itemsToUpdate.map((item) => {
              const { id, ...updatePayload } = item;
              return orderItemsService.updateOrderItem(
                id as number,
                updatePayload,
              );
            }),
          );
        }

        // Items to create
        const itemsToCreate = itemsToProcess.filter((i) => i.id === undefined);
        if (itemsToCreate.length) {
          await Promise.all(
            itemsToCreate.map((item) => {
              const { id, ...createPayload } = item;
              return orderItemsService.addOrderItem({
                ...createPayload,
                order_id: editingId,
              });
            }),
          );
        }
      }

      await loadData();
      resetForm();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to save order.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (order: OrderWithItems) => {
    setEditingId(order.id);
    setForm({
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
    });

    setItemForms(
      order.order_items.length
        ? order.order_items.map(mapOrderItemToForm)
        : [createEmptyItem()],
    );
    setError(null);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this order?");
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await ordersService.deleteOrder(id);
      if (editingId === id) {
        resetForm();
      }
      await loadData();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete order.";
      setError(message);
    }
  };

  const updateItem = (
    key: string,
    field: keyof OrderItemFormState,
    value: string,
  ) => {
    setItemForms((current) =>
      current.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addItemRow = () => {
    setItemForms((current) => [...current, createEmptyItem()]);
  };

  const removeItemRow = (key: string) => {
    setItemForms((current) => {
      if (current.length === 1) {
        return [createEmptyItem()];
      }
      return current.filter((item) => item.key !== key);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm">
            Manage orders and nested line items in one workflow.
          </p>
        </div>
        <Badge variant="outline" className="glass-pill w-fit text-xs">
          {orders.length} orders
        </Badge>
      </div>

      <Card className="glass-panel border-white/60">
        <CardHeader>
          <CardTitle>
            {editingId === null ? "Create Order" : "Edit Order"}
          </CardTitle>
          <CardDescription>
            {editingId === null
              ? "Create an order with one or more item rows."
              : "Update order details and replace item rows."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="order-id">Order ID</Label>
                <Input
                  id="order-id"
                  value={form.order_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      order_id: event.target.value,
                    }))
                  }
                  placeholder="SSO-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-customer">Customer</Label>
                <NativeSelect
                  id="order-customer"
                  className="w-full"
                  value={form.customer_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customer_id: event.target.value,
                    }))
                  }
                >
                  <NativeSelectOption value="">No customer</NativeSelectOption>
                  {customers.map((customer) => (
                    <NativeSelectOption
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-status">Status</Label>
                <Input
                  id="order-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  placeholder="pending"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-from">Order From</Label>
                <Input
                  id="order-from"
                  value={form.order_from}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      order_from: event.target.value,
                    }))
                  }
                  placeholder="Taobao"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="order-exchange-rate">Exchange Rate</Label>
                <Input
                  id="order-exchange-rate"
                  type="number"
                  step="0.01"
                  value={form.exchange_rate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      exchange_rate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-service-fee">Service Fee</Label>
                <Input
                  id="order-service-fee"
                  type="number"
                  step="0.01"
                  value={form.service_fee}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      service_fee: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-service-fee-type">Service Fee Type</Label>
                <NativeSelect
                  id="order-service-fee-type"
                  className="w-full"
                  value={form.service_fee_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      service_fee_type: event.target.value,
                    }))
                  }
                >
                  <NativeSelectOption value="fixed">Fixed</NativeSelectOption>
                  <NativeSelectOption value="percent">
                    Percent
                  </NativeSelectOption>
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-discount">Product Discount</Label>
                <Input
                  id="order-discount"
                  type="number"
                  step="0.01"
                  value={form.product_discount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      product_discount: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="order-shipping-fee">Shipping Fee</Label>
                <Input
                  id="order-shipping-fee"
                  type="number"
                  step="0.01"
                  value={form.shipping_fee}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      shipping_fee: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-delivery-fee">Delivery Fee</Label>
                <Input
                  id="order-delivery-fee"
                  type="number"
                  step="0.01"
                  value={form.delivery_fee}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      delivery_fee: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-cargo-fee">Cargo Fee</Label>
                <Input
                  id="order-cargo-fee"
                  type="number"
                  step="0.01"
                  value={form.cargo_fee}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cargo_fee: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="order-order-date">Order Date</Label>
                <Input
                  id="order-order-date"
                  type="date"
                  value={form.order_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      order_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-arrived-date">Arrived Date</Label>
                <Input
                  id="order-arrived-date"
                  type="date"
                  value={form.arrived_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      arrived_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-shipment-date">Shipment Date</Label>
                <Input
                  id="order-shipment-date"
                  type="date"
                  value={form.shipment_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      shipment_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-withdraw-date">Withdraw Date</Label>
                <Input
                  id="order-withdraw-date"
                  type="date"
                  value={form.user_withdraw_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      user_withdraw_date: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/55 bg-white/40 p-4">
              <p className="text-sm font-medium">Order Flags</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["shipping_fee_paid", "Shipping fee paid"],
                  ["delivery_fee_paid", "Delivery fee paid"],
                  ["cargo_fee_paid", "Cargo fee paid"],
                  ["service_fee_paid", "Service fee paid"],
                  ["shipping_fee_by_shop", "Shipping fee by shop"],
                  ["delivery_fee_by_shop", "Delivery fee by shop"],
                  ["cargo_fee_by_shop", "Cargo fee by shop"],
                  ["exclude_cargo_fee", "Exclude cargo fee"],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={form[field as keyof OrderFormState] as boolean}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          [field]: checked === true,
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/55 bg-white/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Order Items</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                >
                  <Plus className="size-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {itemForms.map((item, index) => (
                  <div
                    key={item.key}
                    className="grid gap-3 rounded-xl border border-white/55 bg-white/55 p-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                  >
                    <Input
                      placeholder="Product URL"
                      value={item.product_url}
                      onChange={(event) =>
                        updateItem(item.key, "product_url", event.target.value)
                      }
                    />
                    <Input
                      placeholder="Qty"
                      type="number"
                      value={item.product_qty}
                      onChange={(event) =>
                        updateItem(item.key, "product_qty", event.target.value)
                      }
                    />
                    <Input
                      placeholder="Price"
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(event) =>
                        updateItem(item.key, "price", event.target.value)
                      }
                    />
                    <Input
                      placeholder="Weight"
                      type="number"
                      step="0.01"
                      value={item.product_weight}
                      onChange={(event) =>
                        updateItem(
                          item.key,
                          "product_weight",
                          event.target.value,
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => removeItemRow(item.key)}
                      aria-label={`Remove item row ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving}>
                <PackagePlus className="size-4" />
                {isSaving
                  ? "Saving..."
                  : editingId === null
                    ? "Create Order"
                    : "Update Order"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSaving}
              >
                <Plus className="size-4" />
                New
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-panel border-white/60">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">Order Records</CardTitle>
            <CardDescription>Read, edit, and delete any order.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadData()}>
            <RefreshCcw className="size-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/40 hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-4 text-center">
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-4 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}

              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-white/35 hover:bg-white/30"
                >
                  <TableCell className="font-medium">
                    {order.order_id || `ID: ${order.id}`}
                  </TableCell>
                  <TableCell>
                    {order.customer_id
                      ? customerMap.get(order.customer_id) || "Unknown"
                      : "-"}
                  </TableCell>
                  <TableCell>{order.status || "-"}</TableCell>
                  <TableCell>{order.order_items.length}</TableCell>
                  <TableCell>
                    ${calculateOrderTotal(order).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {order.order_date
                      ? new Date(order.order_date).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(order)}
                      >
                        <UserPen className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(order.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};
