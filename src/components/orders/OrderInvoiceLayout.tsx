import { MapPin, Phone } from "lucide-react";

import type { OrderWithItems } from "@/services/orders.service";
import type { Customer } from "@/types/database";

interface OrderInvoiceLayoutProps {
  order: OrderWithItems;
  customer: Customer | null;
  logoSrc: string | null;
}

const MYANMAR_FONT_STACK =
  "\"Pyidaungsu\", \"Noto Sans Myanmar\", \"Myanmar Text\", \"SF Pro Display\", \"Avenir Next\", \"Nunito Sans\", sans-serif";

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

const getStatusLabel = (status: string | null): string => {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getStatusClassName = (status: string | null): string => {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "confirmed":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "shipping":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "cancelled":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const toNumber = (value: number | null | undefined): number => value ?? 0;

interface FeeRowProps {
  label: string;
  amount: number;
  paid?: boolean | null;
  byShop?: boolean | null;
  include?: boolean;
}

const FeeRow = ({ label, amount, paid, byShop, include = true }: FeeRowProps) => {
  return (
    <div className="border-slate-200 py-3 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {typeof paid === "boolean" && (
              <span
                className={`rounded-full border px-2 py-0.5 ${
                  paid
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {paid ? "Paid" : "Unpaid"}
              </span>
            )}
            {typeof byShop === "boolean" && (
              <span
                className={`rounded-full border px-2 py-0.5 ${
                  byShop
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {byShop ? "Shop" : "Customer"}
              </span>
            )}
            <span
              className={`rounded-full border px-2 py-0.5 ${
                include
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {include ? "Include" : "Exclude"}
            </span>
          </div>
        </div>
        <p className="text-xl font-semibold text-slate-900">{formatBaht(amount)}</p>
      </div>
    </div>
  );
};

export const OrderInvoiceLayout = ({
  order,
  customer,
  logoSrc,
}: OrderInvoiceLayoutProps) => {
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

  const totalPrice =
    itemSubtotal +
    serviceFee +
    shippingFee +
    deliveryFee +
    cargoFeeForTotal -
    discount;
  const totalByExchangeRate = totalPrice * exchangeRate;
  const profit = serviceFee;

  return (
    <div className="space-y-6 text-slate-900" style={{ fontFamily: MYANMAR_FONT_STACK }}>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-3xl font-semibold tracking-tight">Customer Information</h2>

          <div className="mt-5 rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-[2rem] leading-tight font-semibold">
                  {customer?.name || "Unknown Customer"}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rose-600">
                    ID: {customer?.customer_id || "-"}
                  </span>
                  {customer?.platform && (
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                      {customer.platform}
                    </span>
                  )}
                </div>
              </div>

              {logoSrc && (
                <img
                  src={logoSrc}
                  alt="Shop logo"
                  className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                />
              )}
            </div>

            <div className="my-5 border-t border-slate-200" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Phone
                  </p>
                  <p className="inline-flex items-center gap-2 text-[1.95rem] leading-tight">
                    <Phone className="size-7 text-pink-500" />
                    {customer?.phone || "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    City
                  </p>
                  <p className="inline-flex items-center gap-2 text-[1.85rem] leading-tight">
                    <MapPin className="size-7 text-pink-500" />
                    {customer?.city || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Address
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[1.6rem] leading-tight">
                  {customer?.address || "-"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-3xl font-semibold tracking-tight">Status</h2>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClassName(order.status)}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-3xl font-semibold tracking-tight">Financial Summary</h2>

            <div className="mt-4 space-y-3">
              <div className="border-slate-200 border-b pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Total Price</p>
                  <p className="text-2xl font-semibold text-slate-900">{formatBaht(itemSubtotal)}</p>
                </div>
              </div>

              <FeeRow
                label="Service Fee"
                amount={serviceFee}
                paid={order.service_fee_paid}
                include
              />
              <div className="border-slate-200 border-b" />

              <FeeRow
                label="Shipping Fee"
                amount={shippingFee}
                paid={order.shipping_fee_paid}
                byShop={order.shipping_fee_by_shop}
                include
              />
              <div className="border-slate-200 border-b" />

              <FeeRow
                label="Delivery Fee"
                amount={deliveryFee}
                paid={order.delivery_fee_paid}
                byShop={order.delivery_fee_by_shop}
                include
              />
              <div className="border-slate-200 border-b" />

              <FeeRow
                label="Cargo Fee"
                amount={cargoFeeValue}
                paid={order.cargo_fee_paid}
                byShop={order.cargo_fee_by_shop}
                include={!order.exclude_cargo_fee}
              />
              <div className="border-slate-200 border-b" />

              <div className="border-slate-200 border-b pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Product Discount</p>
                  <p className="text-xl font-semibold text-slate-900">{formatBaht(discount)}</p>
                </div>
              </div>

              <div className="border-slate-200 border-b pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold text-slate-900">Total</p>
                  <p className="text-4xl font-semibold text-emerald-500">{formatBaht(totalPrice)}</p>
                </div>
              </div>

              <div className="border-slate-200 border-b pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold text-slate-900">Profit</p>
                  <p className="text-4xl font-semibold text-emerald-500">{formatBaht(profit)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-2xl font-semibold text-slate-900">Total x Exchange Rate</p>
                  <p className="text-4xl font-semibold text-pink-500">
                    {formatKs(totalByExchangeRate)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold tracking-tight">Product Details</h2>

        <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 p-4">
          {order.order_items.map((item, index) => {
            const qty = toNumber(item.product_qty);
            const price = toNumber(item.price);
            const weight = toNumber(item.product_weight);
            const lineTotal = qty * price;

            return (
              <div
                key={item.id}
                className="space-y-3 rounded-xl border border-slate-200 px-4 py-3"
              >
                <div className="inline-flex rounded-full border border-pink-200 bg-pink-50 px-2.5 py-1 text-sm font-semibold text-pink-600">
                  Item {index + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Product Link
                  </p>
                  <p className="mt-1 break-all text-[1.6rem] leading-tight text-pink-500">
                    {item.product_url || "-"}
                  </p>
                </div>

                <div className="grid gap-3 border-slate-200 border-y py-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      Qty
                    </p>
                    <p className="text-center text-[2rem] leading-tight font-semibold">{qty}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      Price
                    </p>
                    <p className="text-center text-[2rem] leading-tight font-semibold">
                      {formatBaht(price)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      Weight (kg)
                    </p>
                    <p className="text-center text-[2rem] leading-tight font-semibold">
                      {formatAmount(weight)} kg
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold text-slate-700">Total</p>
                  <p className="text-4xl font-semibold text-pink-500">{formatBaht(lineTotal)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 border-slate-200 border-t pt-4 sm:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Qty</p>
            <p className="text-[2rem] leading-tight font-semibold">{formatAmount(totalQty)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Price</p>
            <p className="text-[2rem] leading-tight font-semibold">{formatBaht(itemSubtotal)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Weight</p>
            <p className="text-[2rem] leading-tight font-semibold">
              {formatAmount(totalWeight)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Exchange Rate</p>
            <p className="text-[2rem] leading-tight font-semibold">{formatKs(exchangeRate)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-3xl font-semibold tracking-tight">Timeline</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Order Date</p>
            <p className="text-[1.9rem] leading-tight font-semibold">
              {formatDate(order.order_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Arrived Date</p>
            <p className="text-[1.9rem] leading-tight font-semibold">
              {formatDate(order.arrived_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Shipment Date</p>
            <p className="text-[1.9rem] leading-tight font-semibold">
              {formatDate(order.shipment_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">User Withdraw Date</p>
            <p className="text-[1.9rem] leading-tight font-semibold">
              {formatDate(order.user_withdraw_date)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
