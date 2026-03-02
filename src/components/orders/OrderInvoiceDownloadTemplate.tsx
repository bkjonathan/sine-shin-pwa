import type { CSSProperties, RefObject } from "react";

import type { OrderWithItems } from "@/services/orders.service";
import type { OrderItem, ShopSettings } from "@/types/database";

interface OrderInvoiceDownloadTemplateProps {
  invoiceRef: RefObject<HTMLDivElement | null>;
  shopSettings: ShopSettings | null;
  logoDataUrl: string;
  order: OrderWithItems;
  items: OrderItem[];
  customerName: string;
  customerCode: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  customerPlatform: string;
  qrCodeUrl: string;
  serviceFeeAmount: number;
  orderTotal: number;
  exchangeRate: number;
  totalWithExchange: number;
  formatPrice: (amount: number) => string;
  formatExchangePrice: (amount: number) => string;
}

const fallbackLabels = {
  invoiceTitle: "Invoice",
  tel: "Tel",
  status: "Status",
  billTo: "Bill To",
  customerCode: "Customer Code",
  phone: "Phone",
  city: "City",
  address: "Address",
  orderInfo: "Order Information",
  platform: "Platform",
  totalQty: "Total Qty",
  totalWeight: "Total Weight",
  exchangeRate: "Exchange Rate",
  no: "No",
  productLink: "Product Link",
  qty: "Qty",
  unitPrice: "Unit Price",
  weight: "Weight",
  amount: "Amount",
  notes: "Notes",
  notesBody: "Keep this invoice for payment confirmation and shipment tracking.",
  notesHint: "Presented by Sine Shin order management system.",
  qrCode: "QR Code",
  subtotal: "Subtotal",
  productDiscount: "Product Discount",
  serviceFee: "Service Fee",
  shippingFee: "Shipping Fee",
  deliveryFee: "Delivery Fee",
  cargoFee: "Cargo Fee",
  totalFees: "Total Fees",
  total: "Grand Total",
  totalWithExchange: "Total With Exchange",
  footerCredit: "Thank you for your business with Sine Shin.",
};

const t = (key: string, fallback: string): string => {
  // i18n fallback path: this project currently does not provide translation hooks.
  return key ? fallback : fallback;
};

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

const getStatusLabel = (status: string | null): string => {
  if (!status) {
    return "PENDING";
  }

  return status
    .split("_")
    .map((chunk) => chunk.toUpperCase())
    .join(" ");
};

const baseCardStyle: CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: "14px",
  backgroundColor: "#f8fafc",
  padding: "16px",
};

const cellHeadStyle: CSSProperties = {
  padding: "12px",
  textAlign: "left",
  fontSize: "12px",
  color: "#0f172a",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 700,
};

const cellBodyStyle: CSSProperties = {
  borderTop: "1px solid #f1f5f9",
  padding: "12px",
  fontSize: "13px",
  color: "#0f172a",
};

export default function OrderInvoiceDownloadTemplate({
  invoiceRef,
  shopSettings,
  logoDataUrl,
  order,
  items,
  customerName,
  customerCode,
  customerPhone,
  customerCity,
  customerAddress,
  customerPlatform,
  qrCodeUrl,
  serviceFeeAmount,
  orderTotal,
  exchangeRate,
  totalWithExchange,
  formatPrice,
  formatExchangePrice,
}: OrderInvoiceDownloadTemplateProps) {
  const subtotal = items.reduce((sum, item) => {
    return sum + toNumber(item.price) * toNumber(item.product_qty);
  }, 0);

  const productDiscount = toNumber(order.product_discount);
  const shippingFee = toNumber(order.shipping_fee);
  const deliveryFee = toNumber(order.delivery_fee);
  const cargoFee = toNumber(order.cargo_fee);
  const totalQty = items.reduce((sum, item) => sum + toNumber(item.product_qty), 0);
  const totalWeight = items.reduce(
    (sum, item) => sum + toNumber(item.product_weight),
    0,
  );
  const totalFees = shippingFee + deliveryFee + cargoFee + serviceFeeAmount;

  return (
    <div
      style={{
        position: "fixed",
        left: "-9999px",
        top: "-9999px",
        pointerEvents: "none",
      }}
    >
      <div
        id="invoice-download-container"
        ref={invoiceRef}
        style={{
          width: "920px",
          background:
            "linear-gradient(180deg, #eff6ff 0%, #ffffff 120px, #ffffff 100%)",
          color: "#0f172a",
          padding: "40px",
          fontFamily:
            "'Noto Sans Myanmar', 'Myanmar Text', 'SF Pro Display', 'Avenir Next', 'Nunito Sans', sans-serif",
          borderRadius: "18px",
          border: "1px solid #dbeafe",
          boxShadow: "0 26px 54px -32px rgba(15, 23, 42, 0.45)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
            paddingBottom: "24px",
            borderBottom: "1px solid #bfdbfe",
          }}
        >
          <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="Logo"
                style={{
                  width: "84px",
                  height: "84px",
                  objectFit: "contain",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  padding: "6px",
                }}
              />
            ) : null}
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  fontWeight: 800,
                  letterSpacing: "0.01em",
                }}
              >
                {shopSettings?.shop_name || "Sine Shin"}
              </h1>
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#475569" }}>
                {shopSettings?.phone
                  ? `${t("common.tel", fallbackLabels.tel)}: ${shopSettings.phone}`
                  : ""}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>
                {shopSettings?.address || ""}
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-flex",
                borderRadius: "999px",
                padding: "6px 14px",
                background:
                  "linear-gradient(135deg, #2563eb 0%, #0ea5e9 55%, #14b8a6 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              {t("orders.invoice.title", fallbackLabels.invoiceTitle)}
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#334155" }}>
              #{order.order_id || order.id}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#334155" }}>
              {formatDate(order.order_date)}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              {t("orders.status", fallbackLabels.status)}: {getStatusLabel(order.status)}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={baseCardStyle}>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "11px",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {t("orders.invoice.bill_to", fallbackLabels.billTo)}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "20px",
                color: "#0f172a",
                fontWeight: 700,
              }}
            >
              {customerName}
            </p>
            <p style={{ margin: "4px 0 10px", fontSize: "12px", color: "#334155" }}>
              {t("customers.id_label", fallbackLabels.customerCode)}: {customerCode}
            </p>
            <p style={{ margin: "2px 0", fontSize: "13px", color: "#334155" }}>
              {t("customers.form.phone", fallbackLabels.phone)}: {customerPhone}
            </p>
            <p style={{ margin: "2px 0", fontSize: "13px", color: "#334155" }}>
              {t("customers.form.city", fallbackLabels.city)}: {customerCity}
            </p>
            <p style={{ margin: "2px 0", fontSize: "13px", color: "#334155" }}>
              {t("customers.form.address", fallbackLabels.address)}: {customerAddress}
            </p>
          </div>

          <div
            style={{
              ...baseCardStyle,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: "8px",
              alignContent: "start",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "11px",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                gridColumn: "1 / span 2",
              }}
            >
              {t("orders.invoice.order_info", fallbackLabels.orderInfo)}
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t("orders.invoice.platform", fallbackLabels.platform)}
            </span>
            <span style={{ fontSize: "13px", color: "#0f172a", textAlign: "right" }}>
              {customerPlatform}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t("orders.invoice.total_qty", fallbackLabels.totalQty)}
            </span>
            <span style={{ fontSize: "13px", color: "#0f172a", textAlign: "right" }}>
              {totalQty}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t("orders.invoice.total_weight", fallbackLabels.totalWeight)}
            </span>
            <span style={{ fontSize: "13px", color: "#0f172a", textAlign: "right" }}>
              {totalWeight} kg
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t("orders.form.exchange_rate", fallbackLabels.exchangeRate)}
            </span>
            <span style={{ fontSize: "13px", color: "#0f172a", textAlign: "right" }}>
              {formatExchangePrice(exchangeRate)}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              border: "1px solid #dbeafe",
              borderRadius: "14px",
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#eff6ff" }}>
                <th style={cellHeadStyle}>{t("common.no", fallbackLabels.no)}</th>
                <th style={cellHeadStyle}>
                  {t("orders.product_link", fallbackLabels.productLink)}
                </th>
                <th style={{ ...cellHeadStyle, textAlign: "right" }}>
                  {t("orders.invoice.qty", fallbackLabels.qty)}
                </th>
                <th style={{ ...cellHeadStyle, textAlign: "right" }}>
                  {t("orders.invoice.price", fallbackLabels.unitPrice)}
                </th>
                <th style={{ ...cellHeadStyle, textAlign: "right" }}>
                  {t("orders.invoice.weight", fallbackLabels.weight)}
                </th>
                <th style={{ ...cellHeadStyle, textAlign: "right" }}>
                  {t("orders.invoice.amount", fallbackLabels.amount)}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ ...cellBodyStyle, color: "#64748b" }}>{index + 1}</td>
                  <td
                    style={{
                      ...cellBodyStyle,
                      wordBreak: "break-all",
                      maxWidth: "320px",
                    }}
                  >
                    {item.product_url || "-"}
                  </td>
                  <td style={{ ...cellBodyStyle, textAlign: "right" }}>
                    {toNumber(item.product_qty)}
                  </td>
                  <td style={{ ...cellBodyStyle, textAlign: "right" }}>
                    {formatPrice(toNumber(item.price))}
                  </td>
                  <td style={{ ...cellBodyStyle, textAlign: "right" }}>
                    {toNumber(item.product_weight)} kg
                  </td>
                  <td
                    style={{
                      ...cellBodyStyle,
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {formatPrice(toNumber(item.price) * toNumber(item.product_qty || 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "18px",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "14px",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                {t("orders.invoice.notes", fallbackLabels.notes)}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#334155" }}>
                {t("orders.invoice.notes_body", fallbackLabels.notesBody)}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                {t("orders.invoice.footer_message", fallbackLabels.notesHint)}
              </p>
            </div>
            <div
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                padding: "4px",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={t("orders.invoice.qr_code", fallbackLabels.qrCode)}
                  style={{ width: "82px", height: "82px", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>
                  {t("orders.invoice.qr_code", fallbackLabels.qrCode)}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #dbeafe",
              borderRadius: "14px",
              padding: "18px",
              background:
                "linear-gradient(170deg, #ffffff 0%, #f8fafc 70%, #eff6ff 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "8px",
                color: "#334155",
              }}
            >
              <span>{t("orders.invoice.subtotal", fallbackLabels.subtotal)}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "8px",
                color: "#334155",
              }}
            >
              <span>
                {t("orders.form.product_discount", fallbackLabels.productDiscount)}
              </span>
              <span>{formatPrice(productDiscount)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "8px",
                color: "#334155",
              }}
            >
              <span>{t("orders.form.service_fee", fallbackLabels.serviceFee)}</span>
              <span>{formatPrice(serviceFeeAmount)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "8px",
                color: "#334155",
              }}
            >
              <span>{t("orders.form.shipping_fee", fallbackLabels.shippingFee)}</span>
              <span>{formatPrice(shippingFee)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "8px",
                color: "#334155",
              }}
            >
              <span>{t("orders.form.delivery_fee", fallbackLabels.deliveryFee)}</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "8px",
                color: "#334155",
              }}
            >
              <span>{t("orders.form.cargo_fee", fallbackLabels.cargoFee)}</span>
              <span>{formatPrice(cargoFee)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px dashed #cbd5e1",
                color: "#334155",
              }}
            >
              <span>{t("orders.invoice.total_fees", fallbackLabels.totalFees)}</span>
              <span>{formatPrice(totalFees)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "22px",
                marginTop: "12px",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              <span>{t("orders.invoice.total", fallbackLabels.total)}</span>
              <span>{formatPrice(orderTotal)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid #dbeafe",
                color: "#0f172a",
                fontWeight: 600,
              }}
            >
              <span>
                {t("orders.invoice.total_with_exchange", fallbackLabels.totalWithExchange)}
              </span>
              <span>{formatExchangePrice(totalWithExchange)}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          <p style={{ margin: 0 }}>
            {t("orders.invoice.footer_credit", fallbackLabels.footerCredit)}
          </p>
        </div>
      </div>
    </div>
  );
}
