import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toPng } from "html-to-image";

import appLogo from "@/assets/logo.png";
import { OrderDetailsCompactView } from "@/components/orders/OrderDetailsCompactView";
import OrderInvoiceDownloadTemplate from "@/components/orders/OrderInvoiceDownloadTemplate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { customersService } from "@/services/customers.service";
import { ordersService, type OrderWithItems } from "@/services/orders.service";
import { shopSettingsService } from "@/services/shopSettings.service";
import type { Customer, ShopSettings } from "@/types/database";

const MYANMAR_FONT_EMBED_CSS = `
@font-face {
  font-family: "MyanmarCapture";
  src: local("Pyidaungsu"), local("Noto Sans Myanmar"), local("Myanmar Text");
  font-style: normal;
  font-weight: 400;
}
* {
  font-family: "MyanmarCapture", "Pyidaungsu", "Noto Sans Myanmar", "Myanmar Text", "SF Pro Display", "Avenir Next", "Nunito Sans", sans-serif;
}
`;

const delay = (durationMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

const isIOSDevice = (): boolean => {
  const ua = window.navigator.userAgent;
  const isIOSUserAgent = /iPad|iPhone|iPod/.test(ua);
  const isIPadOSMac =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return isIOSUserAgent || isIPadOSMac;
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [metadata, base64Payload] = dataUrl.split(",");
  if (!metadata || !base64Payload) {
    throw new Error("Generated invoice image is invalid.");
  }

  const mimeMatch = metadata.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "image/png";
  const binary = window.atob(base64Payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to convert image blob to data URL."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image blob."));
    reader.readAsDataURL(blob);
  });

const toCaptureSafeImageSrc = async (
  source: string | null | undefined,
): Promise<string | null> => {
  if (!source) {
    return null;
  }

  if (source.startsWith("data:")) {
    return source;
  }

  try {
    const targetUrl = new URL(source, window.location.origin);
    const response = await fetch(targetUrl.toString(), {
      mode: "cors",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`Asset request failed with status ${response.status}.`);
    }

    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (assetError) {
    console.error("Failed to prepare invoice image asset:", assetError);
    return null;
  }
};

const getQrValueUrl = (order: OrderWithItems): string => {
  const firstItemUrl = order.order_items
    .map((item) => item.product_url?.trim())
    .find((url): url is string => Boolean(url));

  if (firstItemUrl) {
    return firstItemUrl;
  }

  return new URL(`/orders/${order.id}`, window.location.origin).toString();
};

const buildQrCodeImageApiUrl = (valueUrl: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(valueUrl)}`;
};

const formatCreatedDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-GB").replaceAll("/", "-");
};

const formatPrice = (amount: number): string =>
  `฿ ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatExchangePrice = (amount: number): string =>
  `Ks ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const toNumber = (value: number | null | undefined): number => value ?? 0;

const getInvoiceFileName = (order: OrderWithItems): string => {
  const baseCode = (order.order_id || `order-${order.id}`)
    .trim()
    .replaceAll(/[^a-zA-Z0-9_-]+/g, "-")
    .replaceAll(/-{2,}/g, "-")
    .replaceAll(/^-|-$/g, "");

  return `${baseCode || `order-${order.id}`}-invoice.png`;
};

const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const captureInvoicePngBlob = async (
  invoiceNode: HTMLElement,
  fileName: string,
): Promise<{ blob: Blob; file: File }> => {
  if ("fonts" in document) {
    await document.fonts.ready;
  }

  await delay(150);

  const dataUrl = await toPng(invoiceNode, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    skipFonts: true,
    fontEmbedCSS: MYANMAR_FONT_EMBED_CSS,
  });

  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], fileName, { type: "image/png" });

  return { blob, file };
};

export const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const parsedOrderId = useMemo(
    () => (typeof orderId === "string" ? Number.parseInt(orderId, 10) : NaN),
    [orderId],
  );

  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const pendingIOSWindowRef = useRef<Window | null>(null);

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const loadOrderDetails = useCallback(async () => {
    if (Number.isNaN(parsedOrderId)) {
      setError("Invalid order id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const orderRecord = await ordersService.getOrderById(parsedOrderId);
      if (!orderRecord) {
        setError("Order record was not found.");
        setOrder(null);
        setCustomer(null);
        setShopSettings(null);
        setLogoDataUrl(null);
        setQrCodeDataUrl(null);
        return;
      }

      setOrder(orderRecord);

      const [customerRecord, shopSettings] = await Promise.all([
        orderRecord.customer_id
          ? customersService.getCustomerById(orderRecord.customer_id)
          : Promise.resolve(null),
        shopSettingsService.getSettings(),
      ]);

      setCustomer(customerRecord);
      setShopSettings(shopSettings);

      const primaryLogoSource =
        shopSettings?.logo_cloud_url ?? shopSettings?.logo_path ?? appLogo;
      const preparedPrimaryLogo = await toCaptureSafeImageSrc(primaryLogoSource);
      if (preparedPrimaryLogo) {
        setLogoDataUrl(preparedPrimaryLogo);
      } else if (primaryLogoSource !== appLogo) {
        setLogoDataUrl(await toCaptureSafeImageSrc(appLogo));
      } else {
        setLogoDataUrl(null);
      }

      const qrValueUrl = getQrValueUrl(orderRecord);
      const qrImageApiUrl = buildQrCodeImageApiUrl(qrValueUrl);
      const preparedQrCode = await toCaptureSafeImageSrc(qrImageApiUrl);
      setQrCodeDataUrl(preparedQrCode);
    } catch (loadError) {
      setError(toErrorMessage(loadError, "Failed to load order details."));
      setOrder(null);
      setCustomer(null);
      setShopSettings(null);
      setLogoDataUrl(null);
      setQrCodeDataUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [parsedOrderId]);

  useEffect(() => {
    void loadOrderDetails();
  }, [loadOrderDetails]);

  const downloadInvoicePng = useCallback(async (fileName: string, blob: Blob) => {
    const file = new File([blob], fileName, { type: "image/png" });

    if (isIOSDevice()) {
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          if (pendingIOSWindowRef.current && !pendingIOSWindowRef.current.closed) {
            pendingIOSWindowRef.current.close();
          }
          pendingIOSWindowRef.current = null;
          return;
        }
      } catch (shareError) {
        console.error("Web Share API failed for invoice PNG:", shareError);
      }

      const objectUrl = URL.createObjectURL(blob);
      const pendingWindow = pendingIOSWindowRef.current;
      if (pendingWindow && !pendingWindow.closed) {
        pendingWindow.location.href = objectUrl;
      } else {
        const openedWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");
        if (!openedWindow) {
          URL.revokeObjectURL(objectUrl);
          throw new Error("Unable to open invoice image tab. Please allow popups.");
        }
      }

      pendingIOSWindowRef.current = null;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setDownloadNotice(
        "Invoice opened in a new tab. Use Share or long-press the image to save it.",
      );
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = "noopener";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }, []);

  const handleDownloadInvoice = useCallback(async () => {
    if (!order) {
      setError("Order details are still loading.");
      return;
    }

    const invoiceNode = invoiceRef.current;
    if (!invoiceNode) {
      setError("Invoice view is not ready for export.");
      return;
    }

    setError(null);
    setDownloadNotice(null);
    setDownloading(true);

    if (isIOSDevice()) {
      pendingIOSWindowRef.current = window.open("", "_blank");
      if (pendingIOSWindowRef.current) {
        pendingIOSWindowRef.current.document.title = "Preparing invoice...";
        pendingIOSWindowRef.current.document.body.innerHTML =
          "<p style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px;\">Preparing invoice...</p>";
      }
    }

    try {
      const fileName = getInvoiceFileName(order);
      const { blob } = await captureInvoicePngBlob(invoiceNode, fileName);
      await downloadInvoicePng(fileName, blob);
    } catch (downloadError) {
      if (pendingIOSWindowRef.current && !pendingIOSWindowRef.current.closed) {
        pendingIOSWindowRef.current.close();
      }
      pendingIOSWindowRef.current = null;
      console.error("Failed to download invoice PNG:", downloadError);
      setError(toErrorMessage(downloadError, "Failed to download invoice image."));
    } finally {
      setDownloading(false);
    }
  }, [downloadInvoicePng, order]);

  const handlePrintInvoice = () => {
    window.print();
  };

  const computedInvoiceData = useMemo(() => {
    if (!order) {
      return null;
    }

    const itemSubtotal = order.order_items.reduce((sum, item) => {
      return sum + toNumber(item.price) * toNumber(item.product_qty);
    }, 0);
    const serviceFeeBase = toNumber(order.service_fee);
    const serviceFeeAmount =
      order.service_fee_type === "percent"
        ? (itemSubtotal * serviceFeeBase) / 100
        : serviceFeeBase;
    const shippingFee = toNumber(order.shipping_fee);
    const deliveryFee = toNumber(order.delivery_fee);
    const cargoFee = order.exclude_cargo_fee ? 0 : toNumber(order.cargo_fee);
    const discount = toNumber(order.product_discount);
    const orderTotal =
      itemSubtotal + serviceFeeAmount + shippingFee + deliveryFee + cargoFee - discount;
    const exchangeRate = toNumber(order.exchange_rate);
    const totalWithExchange = orderTotal * exchangeRate;

    return {
      serviceFeeAmount,
      orderTotal,
      exchangeRate,
      totalWithExchange,
    };
  }, [order]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-7xl space-y-4 pb-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            Order Management
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Order Details #{order?.order_id || "Loading"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Created on {formatCreatedDate(order?.created_at ?? null)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="glass-pill text-xs">
            Detail View
          </Badge>
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice} disabled={downloading || isLoading || !order}>
            <Download className="size-4" />
            {downloading ? "Downloading..." : "Download Invoice"}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintInvoice} disabled={isLoading}>
            <Printer className="size-4" />
            Print Invoice
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/orders">
              <ArrowLeft className="size-4" />
              Back to Orders
            </Link>
          </Button>
          {order && (
            <Button size="sm" onClick={() => navigate(`/orders/${order.id}/edit`)}>
              Edit Order
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {downloadNotice && !error && (
        <Alert>
          <AlertDescription>{downloadNotice}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="text-muted-foreground rounded-3xl border border-white/55 bg-white/45 p-6 text-sm">
          Loading order details...
        </div>
      )}

      {!isLoading && order && (
        <>
          <OrderDetailsCompactView order={order} customer={customer} />

          {computedInvoiceData && (
            <OrderInvoiceDownloadTemplate
              invoiceRef={invoiceRef}
              shopSettings={shopSettings}
              logoDataUrl={logoDataUrl || ""}
              order={order}
              items={order.order_items}
              customerName={customer?.name || "Unknown Customer"}
              customerCode={customer?.customer_id || "-"}
              customerPhone={customer?.phone || "-"}
              customerCity={customer?.city || "-"}
              customerAddress={customer?.address || "-"}
              customerPlatform={customer?.platform || order.order_from || "-"}
              qrCodeUrl={qrCodeDataUrl || ""}
              serviceFeeAmount={computedInvoiceData.serviceFeeAmount}
              orderTotal={computedInvoiceData.orderTotal}
              exchangeRate={computedInvoiceData.exchangeRate}
              totalWithExchange={computedInvoiceData.totalWithExchange}
              formatPrice={formatPrice}
              formatExchangePrice={formatExchangePrice}
            />
          )}
        </>
      )}
    </motion.div>
  );
};
