import { CalendarDays, MapPin, Phone, UserRound } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrderWithItems } from "@/services/orders.service";
import type { Customer } from "@/types/database";

interface OrderDetailsCompactViewProps {
  order: OrderWithItems;
  customer: Customer | null;
}

const toNumber = (value: number | null | undefined): number => value ?? 0;

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-GB").replaceAll("/", "-");
};

const formatAmount = (value: number): string =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatBaht = (value: number): string => `฿ ${formatAmount(value)}`;
const formatKs = (value: number): string => `Ks ${formatAmount(value)}`;

const getStatusClassName = (status: string | null): string => {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "confirmed":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "shipping":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const getStatusLabel = (status: string | null): string => {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

interface SummaryRow {
  label: string;
  value: string;
  tone?: "default" | "positive" | "accent";
}

const SummaryValue = ({
  value,
  tone = "default",
}: {
  value: string;
  tone?: "default" | "positive" | "accent";
}) => {
  if (tone === "positive") {
    return <span className="font-semibold text-emerald-600">{value}</span>;
  }
  if (tone === "accent") {
    return <span className="font-semibold text-pink-600">{value}</span>;
  }
  return <span className="font-semibold">{value}</span>;
};

export const OrderDetailsCompactView = ({
  order,
  customer,
}: OrderDetailsCompactViewProps) => {
  const itemSubtotal = order.order_items.reduce((sum, item) => {
    const qty = toNumber(item.product_qty);
    const price = toNumber(item.price);
    return sum + qty * price;
  }, 0);

  const totalQty = order.order_items.reduce(
    (sum, item) => sum + toNumber(item.product_qty),
    0,
  );
  const totalWeight = order.order_items.reduce(
    (sum, item) => sum + toNumber(item.product_weight),
    0,
  );

  const serviceFeeInput = toNumber(order.service_fee);
  const serviceFee =
    order.service_fee_type === "percent"
      ? (itemSubtotal * serviceFeeInput) / 100
      : serviceFeeInput;
  const shippingFee = toNumber(order.shipping_fee);
  const deliveryFee = toNumber(order.delivery_fee);
  const cargoFeeValue = toNumber(order.cargo_fee);
  const cargoFeeForTotal = order.exclude_cargo_fee ? 0 : cargoFeeValue;
  const discount = toNumber(order.product_discount);
  const exchangeRate = toNumber(order.exchange_rate);
  const total =
    itemSubtotal + serviceFee + shippingFee + deliveryFee + cargoFeeForTotal;
  const profit = serviceFee + discount;
  const totalByRate = total * exchangeRate;

  const summaryRows: SummaryRow[] = [
    { label: "Items Subtotal", value: formatBaht(itemSubtotal) },
    { label: "Service Fee", value: formatBaht(serviceFee) },
    { label: "Shipping Fee", value: formatBaht(shippingFee) },
    { label: "Delivery Fee", value: formatBaht(deliveryFee) },
    {
      label: order.exclude_cargo_fee ? "Cargo Fee (Excluded)" : "Cargo Fee",
      value: formatBaht(cargoFeeValue),
    },
    { label: "Product Discount", value: formatBaht(discount) },
    { label: "Total", value: formatBaht(total), tone: "positive" },
    { label: "Profit", value: formatBaht(profit), tone: "positive" },
    { label: "Total x Rate", value: formatKs(totalByRate), tone: "accent" },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card className="glass-panel border-white/60 dark:border-white/25">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/55 bg-white/55 p-3 dark:border-white/20 dark:bg-slate-900/45">
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="mt-1 text-sm font-semibold">
                  {customer?.name || "Unknown Customer"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  ID: {customer?.customer_id || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-white/55 bg-white/55 p-3 dark:border-white/20 dark:bg-slate-900/45">
                <p className="text-muted-foreground text-xs">Platform</p>
                <p className="mt-1 text-sm font-semibold">{customer?.platform || "-"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/55 bg-white/55 p-3 dark:border-white/20 dark:bg-slate-900/45">
                <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <Phone className="size-3.5" />
                  Phone
                </p>
                <p className="mt-1 text-sm font-semibold">{customer?.phone || "-"}</p>
              </div>
              <div className="rounded-xl border border-white/55 bg-white/55 p-3 dark:border-white/20 dark:bg-slate-900/45">
                <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <MapPin className="size-3.5" />
                  City
                </p>
                <p className="mt-1 text-sm font-semibold">{customer?.city || "-"}</p>
              </div>
              <div className="rounded-xl border border-white/55 bg-white/55 p-3 dark:border-white/20 dark:bg-slate-900/45 sm:col-span-2 lg:col-span-1">
                <p className="text-muted-foreground text-xs">Address</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold">
                  {customer?.address || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/60 dark:border-white/25">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:hidden">
              {order.order_items.map((item, index) => {
                const qty = toNumber(item.product_qty);
                const price = toNumber(item.price);
                const weight = toNumber(item.product_weight);
                const lineTotal = qty * price;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/45 bg-white/45 p-3 dark:border-white/20 dark:bg-slate-900/45"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Item #{index + 1}</span>
                      <span className="text-sm font-semibold text-pink-600">
                        {formatBaht(lineTotal)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">Product Link</p>
                    <p className="mt-1 break-all text-xs text-pink-600">
                      {item.product_url || "-"}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Qty</p>
                        <p className="font-semibold">{formatAmount(qty)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-semibold">{formatBaht(price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Weight</p>
                        <p className="font-semibold">{formatAmount(weight)} kg</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/55 text-left text-xs text-slate-500 uppercase dark:border-white/20">
                    <th className="px-2 py-2 font-semibold">Item</th>
                    <th className="px-2 py-2 font-semibold">Product Link</th>
                    <th className="px-2 py-2 font-semibold text-right">Qty</th>
                    <th className="px-2 py-2 font-semibold text-right">Price</th>
                    <th className="px-2 py-2 font-semibold text-right">Weight</th>
                    <th className="px-2 py-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item, index) => {
                    const qty = toNumber(item.product_qty);
                    const price = toNumber(item.price);
                    const weight = toNumber(item.product_weight);
                    const lineTotal = qty * price;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-white/45 dark:border-white/15"
                      >
                        <td className="px-2 py-2">#{index + 1}</td>
                        <td className="max-w-64 truncate px-2 py-2 text-pink-600">
                          {item.product_url || "-"}
                        </td>
                        <td className="px-2 py-2 text-right font-medium">{qty}</td>
                        <td className="px-2 py-2 text-right font-medium">
                          {formatBaht(price)}
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {formatAmount(weight)} kg
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-pink-600">
                          {formatBaht(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 grid gap-2 rounded-xl border border-white/55 bg-white/55 p-3 text-sm dark:border-white/20 dark:bg-slate-900/45 sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-xs">Total Qty</p>
                <p className="font-semibold">{formatAmount(totalQty)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Price</p>
                <p className="font-semibold">{formatBaht(itemSubtotal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Weight</p>
                <p className="font-semibold">{formatAmount(totalWeight)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Exchange Rate</p>
                <p className="font-semibold">{formatKs(exchangeRate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="glass-panel border-white/60 dark:border-white/25">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClassName(order.status)}`}
            >
              {getStatusLabel(order.status)}
            </span>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/60 dark:border-white/25">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summaryRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-white/45 py-1.5 text-sm last:border-b-0 dark:border-white/15"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <SummaryValue value={row.value} tone={row.tone} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/60 dark:border-white/25">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-white/45 bg-white/45 px-3 py-2 dark:border-white/20 dark:bg-slate-900/45">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Order Date
              </span>
              <span className="font-semibold">{formatDate(order.order_date)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/45 bg-white/45 px-3 py-2 dark:border-white/20 dark:bg-slate-900/45">
              <span className="text-muted-foreground">Arrived Date</span>
              <span className="font-semibold">{formatDate(order.arrived_date)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/45 bg-white/45 px-3 py-2 dark:border-white/20 dark:bg-slate-900/45">
              <span className="text-muted-foreground">Shipment Date</span>
              <span className="font-semibold">{formatDate(order.shipment_date)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/45 bg-white/45 px-3 py-2 dark:border-white/20 dark:bg-slate-900/45">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <UserRound className="size-3.5" />
                User Withdraw Date
              </span>
              <span className="font-semibold">{formatDate(order.user_withdraw_date)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
