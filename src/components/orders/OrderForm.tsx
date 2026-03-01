import type { FormEvent } from "react";
import { ArrowLeft, PackagePlus, PencilLine, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="order-id">Order ID</Label>
          <Input
            id="order-id"
            value={form.order_id}
            onChange={(event) => onFieldChange("order_id", event.target.value)}
            placeholder="SSO-001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-customer">Customer</Label>
          <NativeSelect
            id="order-customer"
            className="w-full"
            value={form.customer_id}
            onChange={(event) => onFieldChange("customer_id", event.target.value)}
          >
            <NativeSelectOption value="">No customer</NativeSelectOption>
            {customers.map((customer) => (
              <NativeSelectOption key={customer.id} value={customer.id.toString()}>
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
            onChange={(event) => onFieldChange("status", event.target.value)}
            placeholder="pending"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-from">Order From</Label>
          <Input
            id="order-from"
            value={form.order_from}
            onChange={(event) => onFieldChange("order_from", event.target.value)}
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
          <NativeSelect
            id="order-service-fee-type"
            className="w-full"
            value={form.service_fee_type}
            onChange={(event) =>
              onFieldChange("service_fee_type", event.target.value)
            }
          >
            <NativeSelectOption value="fixed">Fixed</NativeSelectOption>
            <NativeSelectOption value="percent">Percent</NativeSelectOption>
          </NativeSelect>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="space-y-3 rounded-2xl border border-white/55 bg-white/40 p-4 dark:border-white/20 dark:bg-slate-900/35">
        <p className="text-sm font-medium">Order Flags</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {orderFlagFields.map(({ field, label }) => (
            <label
              key={field}
              className="flex cursor-pointer items-center gap-2 text-sm"
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
      </div>

      <div className="space-y-3 rounded-2xl border border-white/55 bg-white/40 p-4 dark:border-white/20 dark:bg-slate-900/35">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Order Items</p>
          <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
            <Plus className="size-4" />
            Add Item
          </Button>
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
                onClick={() => onRemoveItem(item.key)}
                aria-label={`Remove item row ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={isSaving}>
          {isEditMode ? <PencilLine className="size-4" /> : <PackagePlus className="size-4" />}
          {isSaving
            ? "Saving..."
            : isEditMode
              ? "Save Changes"
              : "Create Order"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <ArrowLeft className="size-4" />
          Back to Orders
        </Button>
      </div>
    </form>
  );
};
