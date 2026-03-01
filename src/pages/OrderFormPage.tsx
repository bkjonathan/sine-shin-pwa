import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, PencilLine, PlusSquare } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
import { OrderForm } from "@/components/orders/OrderForm";
import {
  createEmptyItem,
  emptyOrderForm,
  hasItemValue,
  mapOrderToForm,
  toNullableInt,
  toNullableIsoDate,
  toNullableNumber,
  toNullableString,
  type OrderFormState,
  type OrderItemFormState,
} from "@/components/orders/order-form.types";
import { customersService } from "@/services/customers.service";
import { orderItemsService, ordersService } from "@/services/orders.service";
import type { Customer, Order } from "@/types/database";

export const OrderFormPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const hasOrderIdParam = typeof orderId === "string";
  const parsedOrderId = hasOrderIdParam ? Number.parseInt(orderId, 10) : null;
  const isEditMode = hasOrderIdParam;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<OrderFormState>(emptyOrderForm);
  const [itemForms, setItemForms] = useState<OrderItemFormState[]>([
    createEmptyItem(),
  ]);
  const [isLoadingOrder, setIsLoadingOrder] = useState(isEditMode);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);

    try {
      const customerData = await customersService.getCustomers();
      setCustomers(customerData);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customers.";
      setError(message);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  const loadOrder = useCallback(async () => {
    if (!isEditMode) {
      setForm(emptyOrderForm);
      setItemForms([createEmptyItem()]);
      setIsLoadingOrder(false);
      return;
    }

    if (Number.isNaN(parsedOrderId as number)) {
      setError("Invalid order id.");
      setIsLoadingOrder(false);
      return;
    }

    setIsLoadingOrder(true);

    try {
      const order = await ordersService.getOrderById(parsedOrderId as number);
      if (!order) {
        setError("Order record was not found.");
        return;
      }

      const mapped = mapOrderToForm(order);
      setForm(mapped.form);
      setItemForms(mapped.itemForms);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load order.";
      setError(message);
    } finally {
      setIsLoadingOrder(false);
    }
  }, [isEditMode, parsedOrderId]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleFieldChange = <K extends keyof OrderFormState>(
    field: K,
    value: OrderFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleItemFieldChange = (
    key: string,
    field: keyof OrderItemFormState,
    value: string,
  ) => {
    setItemForms((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddItem = () => {
    setItemForms((current) => [...current, createEmptyItem()]);
  };

  const handleRemoveItem = (key: string) => {
    setItemForms((current) => {
      if (current.length === 1) {
        return [createEmptyItem()];
      }
      return current.filter((item) => item.key !== key);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEditMode && Number.isNaN(parsedOrderId as number)) {
      setError("Invalid order id.");
      return;
    }

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
      if (!isEditMode) {
        const itemPayloads = itemsToProcess.map(({ id, ...rest }) => rest);
        await ordersService.createOrder(orderPayload, itemPayloads);
      } else {
        const targetId = parsedOrderId as number;

        await ordersService.updateOrder(targetId, orderPayload);

        const existingOrder = await ordersService.getOrderById(targetId);
        const existingItemIds = existingOrder?.order_items?.map((item) => item.id) || [];

        const currentItemIds = itemsToProcess
          .filter((item) => item.id !== undefined)
          .map((item) => item.id as number);

        const idsToDelete = existingItemIds.filter(
          (id) => !currentItemIds.includes(id),
        );

        if (idsToDelete.length > 0) {
          await Promise.all(idsToDelete.map((id) => orderItemsService.deleteOrderItem(id)));
        }

        const itemsToUpdate = itemsToProcess.filter((item) => item.id !== undefined);
        if (itemsToUpdate.length > 0) {
          await Promise.all(
            itemsToUpdate.map((item) => {
              const { id, ...updatePayload } = item;
              return orderItemsService.updateOrderItem(id as number, updatePayload);
            }),
          );
        }

        const itemsToCreate = itemsToProcess.filter((item) => item.id === undefined);
        if (itemsToCreate.length > 0) {
          await Promise.all(
            itemsToCreate.map((item) => {
              const { id, ...createPayload } = item;
              return orderItemsService.addOrderItem({
                ...createPayload,
                order_id: targetId,
              });
            }),
          );
        }
      }

      navigate("/orders");
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save order.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoadingForm = isLoadingCustomers || isLoadingOrder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-6 pb-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            Order Management
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isEditMode ? "Edit Order" : "Create Order"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditMode
              ? "Update order details and nested line items."
              : "Create a new order with one or more line items."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="glass-pill text-xs">
            {isEditMode ? "Editing Mode" : "Creation Mode"}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link to="/orders">
              <ArrowLeft className="size-4" />
              Back to Directory
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="glass-panel-strong border-white/65 dark:border-white/25">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            {isEditMode ? <PencilLine className="size-4" /> : <PlusSquare className="size-4" />}
            {isEditMode ? "Order Update" : "New Order"}
          </CardTitle>
          <CardDescription>
            Required fields are validated before submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingForm ? (
            <div className="text-muted-foreground py-6 text-sm">Loading order data...</div>
          ) : (
            <OrderForm
              form={form}
              itemForms={itemForms}
              customers={customers}
              isSaving={isSaving}
              isEditMode={isEditMode}
              onSubmit={handleSubmit}
              onCancel={() => navigate("/orders")}
              onFieldChange={handleFieldChange}
              onItemFieldChange={handleItemFieldChange}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
