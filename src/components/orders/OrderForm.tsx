import type { FormEvent } from "react";
import { ArrowLeft, PackagePlus, PencilLine, Plus, Trash2 } from "lucide-react";

import { CustomerAutocompleteSelect } from "@/components/customers/CustomerAutocompleteSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer } from "@/types/database";
import type {
  OrderFormState,
  OrderItemFormState,
} from "@/components/orders/order-form.types";

const orderFlagFields = [
  { field: "shipping_fee_paid", label: "Shipping fee paid" },
  { field: "delivery_fee_paid", label: "Delivery fee paid" },
  { field: "cargo_fee_paid", label: "Cargo fee paid" },
  { field: "service_fee_paid", label: "Service fee paid" },
  { field: "shipping_fee_by_shop", label: "Shipping fee by shop" },
  { field: "delivery_fee_by_shop", label: "Delivery fee by shop" },
  { field: "cargo_fee_by_shop", label: "Cargo fee by shop" },
  { field: "exclude_cargo_fee", label: "Exclude cargo fee" },
] as const;

type OrderFlagField = (typeof orderFlagFields)[number]["field"];

const orderStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipping", label: "Shipping" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const serviceFeeTypeOptions = [
  { value: "fixed", label: "Fixed amount" },
  { value: "percent", label: "Percent" },
] as const;

interface OrderFormProps {
  form: OrderFormState;
  itemForms: OrderItemFormState[];
  customers: Customer[];
  isSaving: boolean;
  isEditMode: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof OrderFormState>(
    field: K,
    value: OrderFormState[K],
  ) => void;
  onItemFieldChange: (
    key: string,
    field: keyof OrderItemFormState,
    value: string,
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (key: string) => void;
}

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const OrderForm = ({
  form,
  itemForms,
  customers,
  isSaving,
  isEditMode,
  onCancel,
  onSubmit,
  onFieldChange,
  onItemFieldChange,
  onAddItem,
  onRemoveItem,
}: OrderFormProps) => {
  const itemsSubtotal = itemForms.reduce((sum, item) => {
    const qty = toNumber(item.product_qty);
    const price = toNumber(item.price);
    return sum + qty * price;
  }, 0);

  const shippingFee = toNumber(form.shipping_fee);
  const deliveryFee = toNumber(form.delivery_fee);
  const cargoFee = toNumber(form.cargo_fee);
  const discount = toNumber(form.product_discount);
  const serviceFeeInput = toNumber(form.service_fee);

  const serviceFee =
    form.service_fee_type === "percent"
      ? (itemsSubtotal * serviceFeeInput) / 100
      : serviceFeeInput;

  const estimatedTotal =
    itemsSubtotal + shippingFee + deliveryFee + cargoFee + serviceFee - discount;

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <section className="space-y-4 rounded-2xl border border-white/55 bg-white/35 p-4 dark:border-white/20 dark:bg-slate-900/35">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Order Basics</h3>
          <p className="text-muted-foreground text-xs">
            {isEditMode
              ? "Review customer and status, then update pricing and timeline details."
              : "Start with customer and status, then fill pricing details."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="order-id">Order ID</Label>
            <Input
              id="order-id"
              value={form.order_id}
              readOnly
              placeholder="Auto-generated from settings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-customer-search">Customer</Label>
            <CustomerAutocompleteSelect
              id="order-customer-search"
              customers={customers}
              value={form.customer_id}
              disabled={isSaving}
              onValueChange={(nextValue) => onFieldChange("customer_id", nextValue)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-status">Status</Label>
            <Select
              value={form.status || "pending"}
              onValueChange={(value) => onFieldChange("status", value)}
            >
              <SelectTrigger id="order-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {orderStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-from">Order Source</Label>
            <Input
              id="order-from"
              value={form.order_from}
              onChange={(event) => onFieldChange("order_from", event.target.value)}
              placeholder="Taobao, WeChat, Shopee..."
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/55 bg-white/35 p-4 dark:border-white/20 dark:bg-slate-900/35">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Pricing</h3>
            <p className="text-muted-foreground text-xs">
              Manage base costs, service fee model, and discount.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/45 bg-white/55 p-3 text-xs dark:border-white/20 dark:bg-slate-900/45 sm:min-w-64">
            <div className="text-muted-foreground">Items Subtotal</div>
            <div className="text-right font-semibold">{itemsSubtotal.toFixed(2)}</div>
            <div className="text-muted-foreground">Estimated Total</div>
            <div className="text-right font-semibold">{estimatedTotal.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="order-exchange-rate">Exchange Rate</Label>
            <Input
              id="order-exchange-rate"
              type="number"
              step="0.01"
              value={form.exchange_rate}
              onChange={(event) => onFieldChange("exchange_rate", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-service-fee">Service Fee</Label>
            <Input
              id="order-service-fee"
              type="number"
              step="0.01"
              value={form.service_fee}
              onChange={(event) => onFieldChange("service_fee", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-service-fee-type">Service Fee Type</Label>
            <Select
              value={form.service_fee_type || "fixed"}
              onValueChange={(value) => onFieldChange("service_fee_type", value)}
            >
              <SelectTrigger id="order-service-fee-type" className="w-full">
                <SelectValue placeholder="Select fee type" />
              </SelectTrigger>
              <SelectContent>
                {serviceFeeTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-discount">Product Discount</Label>
            <Input
              id="order-discount"
              type="number"
              step="0.01"
              value={form.product_discount}
              onChange={(event) => onFieldChange("product_discount", event.target.value)}
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
              onChange={(event) => onFieldChange("shipping_fee", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-delivery-fee">Delivery Fee</Label>
            <Input
              id="order-delivery-fee"
              type="number"
              step="0.01"
              value={form.delivery_fee}
              onChange={(event) => onFieldChange("delivery_fee", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-cargo-fee">Cargo Fee</Label>
            <Input
              id="order-cargo-fee"
              type="number"
              step="0.01"
              value={form.cargo_fee}
              onChange={(event) => onFieldChange("cargo_fee", event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/55 bg-white/35 p-4 dark:border-white/20 dark:bg-slate-900/35">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Timeline</h3>
          <p className="text-muted-foreground text-xs">
            Track each stage from order date to final withdrawal.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="order-order-date">Order Date</Label>
            <Input
              id="order-order-date"
              type="date"
              value={form.order_date}
              onChange={(event) => onFieldChange("order_date", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-arrived-date">Arrived Date</Label>
            <Input
              id="order-arrived-date"
              type="date"
              value={form.arrived_date}
              onChange={(event) => onFieldChange("arrived_date", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-shipment-date">Shipment Date</Label>
            <Input
              id="order-shipment-date"
              type="date"
              value={form.shipment_date}
              onChange={(event) => onFieldChange("shipment_date", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-withdraw-date">Withdraw Date</Label>
            <Input
              id="order-withdraw-date"
              type="date"
              value={form.user_withdraw_date}
              onChange={(event) =>
                onFieldChange("user_withdraw_date", event.target.value)
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/55 bg-white/35 p-4 dark:border-white/20 dark:bg-slate-900/35">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Settlement Flags</h3>
          <p className="text-muted-foreground text-xs">
            Mark paid and by-shop handling status for each fee.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {orderFlagFields.map(({ field, label }) => (
            <label
              key={field}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/30 bg-white/30 p-2.5 text-sm dark:border-white/15 dark:bg-slate-900/35"
            >
              <Checkbox
                checked={form[field]}
                onCheckedChange={(checked) =>
                  onFieldChange(field as OrderFlagField, checked === true)
                }
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/55 bg-white/35 p-4 dark:border-white/20 dark:bg-slate-900/35">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Order Items</h3>
            <p className="text-muted-foreground text-xs">
              Add each product line with qty, price and weight.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
            <Plus className="size-4" />
            Add Item
          </Button>
        </div>

        <div className="text-muted-foreground hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-3 text-xs font-medium uppercase tracking-wide lg:grid">
          <span>Product URL</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Weight</span>
          <span className="text-right">Action</span>
        </div>

        <div className="space-y-3">
          {itemForms.map((item, index) => (
            <div
              key={item.key}
              className="grid gap-3 rounded-xl border border-white/55 bg-white/55 p-3 dark:border-white/20 dark:bg-slate-900/45 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
            >
              <Input
                placeholder="Product URL"
                value={item.product_url}
                onChange={(event) =>
                  onItemFieldChange(item.key, "product_url", event.target.value)
                }
              />
              <Input
                placeholder="Qty"
                type="number"
                value={item.product_qty}
                onChange={(event) =>
                  onItemFieldChange(item.key, "product_qty", event.target.value)
                }
              />
              <Input
                placeholder="Price"
                type="number"
                step="0.01"
                value={item.price}
                onChange={(event) =>
                  onItemFieldChange(item.key, "price", event.target.value)
                }
              />
              <Input
                placeholder="Weight"
                type="number"
                step="0.01"
                value={item.product_weight}
                onChange={(event) =>
                  onItemFieldChange(item.key, "product_weight", event.target.value)
                }
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                className="lg:justify-self-end"
                onClick={() => onRemoveItem(item.key)}
                aria-label={`Remove item row ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-3 rounded-t-2xl border border-white/60 bg-white/75 px-3 py-3 shadow-[0_-16px_36px_-30px_rgba(15,23,42,0.8)] backdrop-blur-xl dark:border-white/20 dark:bg-slate-950/70 sm:mx-0 sm:rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            {isEditMode
              ? "Review pricing and items, then save your changes."
              : "Review pricing and items, then save your order."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              <ArrowLeft className="size-4" />
              Back to Orders
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isEditMode ? <PencilLine className="size-4" /> : <PackagePlus className="size-4" />}
              {isSaving
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Order"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
