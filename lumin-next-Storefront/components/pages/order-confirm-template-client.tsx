"use client";

import { useEffect } from "react";
import { sdk } from "@/lib/config";
import { getCompleteHeadersClient } from "@/lib/shopenup/client-cookies";
import { collectPromoCodesFromOrder } from "@/lib/shopenup/order-promo-codes";
import { formatCurrency } from "@/lib/utils";

type OrderItem = {
  id: string;
  product_id?: string;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;
  total?: number;
  title?: string;
  product_title?: string;
  thumbnail?: string | null;
  adjustments?: Array<{ code?: string | null; amount?: number }> | null;
  variant?: {
    product?: {
      thumbnail?: string | null;
      handle?: string | null;
    } | null;
  } | null;
};

type PostalAddress = {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  phone?: string | null;
};

type StoreOrder = {
  id: string;
  display_id?: number;
  email?: string;
  created_at?: string;
  total?: number;
  subtotal?: number;
  tax_total?: number;
  discount_total?: number;
  shipping_total?: number;
  payment_collections?: Array<{
    payment_sessions?: Array<{
      provider_id?: string;
    }>;
  }>;
  items?: OrderItem[];
  shipping_methods?: Array<{
    adjustments?: Array<{ code?: string | null; amount?: number }> | null;
  }> | null;
  billing_address?: PostalAddress | null;
  shipping_address?: PostalAddress | null;
};

function pickBillingShipping(order: StoreOrder): {
  billing: PostalAddress | null | undefined;
  shipping: PostalAddress | null | undefined;
} {
  const raw = order as StoreOrder & {
    billingAddress?: PostalAddress | null;
    shippingAddress?: PostalAddress | null;
  };
  const billing = order.billing_address ?? raw.billingAddress ?? null;
  const shippingOnly = order.shipping_address ?? raw.shippingAddress ?? null;
  const shipping = shippingOnly ?? billing;
  return { billing: billing ?? undefined, shipping: shipping ?? undefined };
}

function findAddressElements(root: Element): { billing: HTMLElement | null; shipping: HTMLElement | null } {
  let billing: HTMLElement | null = null;
  let shipping: HTMLElement | null = null;

  root.querySelectorAll(".thank-you-customer-details").forEach((block) => {
    const title = (block.querySelector(".thank-you-title")?.textContent || "").toLowerCase();
    const addr = block.querySelector("address");
    if (!addr) return;
    if (title.includes("billing")) {
      billing = addr as HTMLElement;
    }
    if (title.includes("shipping")) {
      shipping = addr as HTMLElement;
    }
  });

  if (!billing || !shipping) {
    const row = root.querySelector(".thank-you .row") || root.querySelector(".row");
    const cols = row?.querySelectorAll(":scope > .col-md-6");
    if (cols && cols.length >= 2) {
      if (!billing) {
        billing = cols[0].querySelector("address") as HTMLElement | null;
      }
      if (!shipping) {
        shipping = cols[1].querySelector("address") as HTMLElement | null;
      }
    }
  }

  return { billing, shipping };
}

function lineTotal(item: OrderItem) {
  return item.total ?? item.subtotal ?? (item.unit_price || 0) * (item.quantity || 1);
}

function safeDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPaymentLabel(raw: string): string {
  const s = raw.replace(/^pp[-_]/i, "").replace(/[-_]+/g, " ").trim();
  if (!s) return "N/A";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function findNestedString(input: unknown, keys: Set<string>): string {
  const seen = new WeakSet<object>();
  const queue: unknown[] = [input];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current as object)) continue;
    seen.add(current as object);
    const rec = current as Record<string, unknown>;
    for (const [k, v] of Object.entries(rec)) {
      if (keys.has(k) && typeof v === "string" && v.trim()) {
        return v.trim();
      }
      if (v && typeof v === "object") {
        queue.push(v);
      }
    }
  }
  return "";
}

function formatCountry(code?: string): string {
  if (!code) return "";
  const normalized = code.toLowerCase();
  if (normalized === "in") return "India";
  if (normalized === "us") return "United States";
  return code.toUpperCase();
}

function buildAddressHtml(address?: PostalAddress | null, fallbackEmail?: string): string {
  if (!address) {
    return fallbackEmail ? escapeHtml(fallbackEmail) : "-";
  }
  const fullName = [address.first_name, address.last_name].filter(Boolean).join(" ").trim();
  const lines = [
    fullName,
    address.company,
    address.address_1,
    address.address_2,
    address.city,
    address.province,
    address.postal_code,
    formatCountry(address.country_code ?? undefined),
    address.phone
  ]
    .map((line) => (line || "").trim())
    .filter(Boolean);

  if (fallbackEmail) {
    lines.push("", fallbackEmail);
  }

  return lines.map((line) => (line ? escapeHtml(line) : "")).join(" <br /> ");
}

function lineThumb(item: OrderItem): string {
  const a = typeof item.thumbnail === "string" ? item.thumbnail.trim() : "";
  if (a) return a;
  const p = item.variant?.product?.thumbnail;
  return typeof p === "string" ? p.trim() : "";
}

function productHref(item: OrderItem): string | null {
  const handle = item.variant?.product?.handle?.trim();
  if (handle) {
    return `/products/${encodeURIComponent(handle)}`;
  }
  const pid = item.product_id?.trim();
  if (pid) {
    return `/products/${encodeURIComponent(pid)}`;
  }
  return null;
}

export function OrderConfirmTemplateClient({ orderId }: { orderId: string }) {
  useEffect(() => {
    const root = document.querySelector(".thank-you") as HTMLElement | null;
    const section = document.querySelector(".thank-you-section") as HTMLElement | null;
    if (!root) return;

    section?.classList.add("lumin-order-confirm-section");
    root.classList.add("lumin-order-confirm");

    const notice = root.querySelector(".thank-you-notice");
    const overview = root.querySelector(".thank-you-order-overview");
    const detailsBlock = root.querySelector(".thank-you-order-details");
    const table = root.querySelector(".thank-you-order-details table");
    const tbody = table?.querySelector("tbody");
    const tfoot = table?.querySelector("tfoot");
    const setError = (message: string) => {
      if (notice) {
        notice.className = "thank-you-notice lumin-order-confirm__notice lumin-order-confirm__notice--error";
        notice.innerHTML = escapeHtml(message);
      }
    };

    const setMissingOrder = () => {
      if (notice) {
        notice.className = "thank-you-notice lumin-order-confirm__notice lumin-order-confirm__notice--error";
        notice.innerHTML =
          "We couldn’t find your order id in the URL. Open this page from your order confirmation email or your account orders list.";
      }
    };

    if (!overview || !tbody || !tfoot) return;

    if (!orderId.trim()) {
      setMissingOrder();
      return;
    }

    detailsBlock?.classList.add("lumin-order-confirm__details");
    table?.classList.add("lumin-order-confirm__table", "table");

    const load = async () => {
      try {
        const detailFields =
          "id,display_id,email,status,fulfillment_status,payment_status,created_at,total,subtotal,tax_total,shipping_total,discount_total," +
          "payment_collections.*,payment_collections.payment_sessions.*,payment_collections.payments.*,payment_collections.raw_amount," +
          "shipping_address.*,billing_address.*,items.*,items.product_id,items.product_title,items.title,items.thumbnail,items.total,items.unit_price,items.quantity," +
          "items.adjustments.*,items.variant.*,items.variant.product.*," +
          "shipping_methods.*,shipping_methods.adjustments.*";
        let data: { order?: StoreOrder };
        try {
          data = await sdk.client.fetch<{ order?: StoreOrder }>(`/store/orders/${encodeURIComponent(orderId)}`, {
            method: "GET",
            headers: getCompleteHeadersClient(),
            query: { fields: detailFields },
            cache: "no-store",
          });
        } catch {
          data = await sdk.client.fetch<{ order?: StoreOrder }>(`/store/orders/${encodeURIComponent(orderId)}`, {
            method: "GET",
            headers: getCompleteHeadersClient(),
            cache: "no-store",
          });
        }

        const order = data.order;
        if (!order) {
          setError("Order details are not available.");
          return;
        }

        const rawPayment =
          order.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id ||
          findNestedString(order, new Set(["provider_id", "payment_provider_id", "providerId"])) ||
          "N/A";
        const paymentLabel = formatPaymentLabel(rawPayment);

        if (notice) {
          notice.className = "thank-you-notice lumin-order-confirm__notice lumin-order-confirm__notice--success";
          notice.innerHTML = `<span class="lumin-order-confirm__notice-title">Thank you</span><span class="lumin-order-confirm__notice-text">Your order has been received. You’ll get email updates when it ships.</span>`;
        }

        overview.classList.add("lumin-order-confirm__overview");
        const orderNo = String(order.display_id ?? order.id);
        overview.innerHTML = `
          <li class="lumin-order-confirm__overview-item"><span class="lumin-order-confirm__overview-label">Order number</span><strong class="lumin-order-confirm__overview-value">${escapeHtml(orderNo)}</strong></li>
          <li class="lumin-order-confirm__overview-item"><span class="lumin-order-confirm__overview-label">Date</span><strong class="lumin-order-confirm__overview-value">${escapeHtml(safeDate(order.created_at))}</strong></li>
          <li class="lumin-order-confirm__overview-item"><span class="lumin-order-confirm__overview-label">Email</span><strong class="lumin-order-confirm__overview-value">${escapeHtml(order.email || "—")}</strong></li>
          <li class="lumin-order-confirm__overview-item"><span class="lumin-order-confirm__overview-label">Total</span><strong class="lumin-order-confirm__overview-value">${escapeHtml(formatCurrency(order.total || 0))}</strong></li>
          <li class="lumin-order-confirm__overview-item lumin-order-confirm__overview-item--wide"><span class="lumin-order-confirm__overview-label">Payment</span><strong class="lumin-order-confirm__overview-value">${escapeHtml(paymentLabel)}</strong></li>
        `;

        const items = order.items || [];
        tbody.innerHTML = items.length
          ? items
              .map((item) => {
                const titleRaw = item.product_title || item.title || "Item";
                const title = escapeHtml(titleRaw);
                const qty = item.quantity || 1;
                const thumb = lineThumb(item);
                const href = productHref(item);
                const titleHtml = href
                  ? `<a class="lumin-order-confirm__line-title" href="${escapeHtml(href)}">${title}</a>`
                  : `<span class="lumin-order-confirm__line-title">${title}</span>`;
                const thumbHtml = thumb
                  ? `<span class="lumin-order-confirm__line-thumb"><img src="${escapeHtml(thumb)}" alt="" width="48" height="48" loading="lazy" decoding="async" /></span>`
                  : `<span class="lumin-order-confirm__line-thumb lumin-order-confirm__line-thumb--empty" aria-hidden="true"></span>`;
                return `<tr class="order-item lumin-order-confirm__row"><td class="product-name"><div class="lumin-order-confirm__line">${thumbHtml}<div class="lumin-order-confirm__line-body">${titleHtml}<span class="lumin-order-confirm__line-qty">× ${qty}</span></div></div></td><td class="product-total"><span class="amount">${escapeHtml(formatCurrency(lineTotal(item)))}</span></td></tr>`;
              })
              .join("")
          : `<tr class="order-item lumin-order-confirm__row"><td class="product-name" colspan="1">No line items</td><td class="product-total"><span class="amount">${escapeHtml(formatCurrency(0))}</span></td></tr>`;

        const promoCodes = collectPromoCodesFromOrder(order);
        const promoCodesRow =
          promoCodes.length > 0
            ? `<tr class="lumin-order-confirm__tfoot-row"><th>Promo code${promoCodes.length > 1 ? "s" : ""}</th><td><span>${escapeHtml(
                promoCodes.join(", ")
              )}</span></td></tr>`
            : "";
        const discountTotal = order.discount_total ?? 0;
        const discountRow =
          discountTotal > 0
            ? `<tr class="lumin-order-confirm__tfoot-row"><th>Discount</th><td><span class="amount">−${escapeHtml(
                formatCurrency(discountTotal)
              )}</span></td></tr>`
            : "";
        const taxTotal = order.tax_total ?? 0;
        const taxRow =
          taxTotal > 0
            ? `<tr class="lumin-order-confirm__tfoot-row"><th>Tax</th><td><span class="amount">${escapeHtml(
                formatCurrency(taxTotal)
              )}</span></td></tr>`
            : "";

        tfoot.innerHTML = `
          <tr class="lumin-order-confirm__tfoot-row"><th>Subtotal</th><td><span class="amount">${escapeHtml(formatCurrency(order.subtotal || 0))}</span></td></tr>
          ${promoCodesRow}
          ${discountRow}
          <tr class="lumin-order-confirm__tfoot-row"><th>Shipping</th><td><span class="amount">${escapeHtml(formatCurrency(order.shipping_total || 0))}</span></td></tr>
          ${taxRow}
          <tr class="lumin-order-confirm__tfoot-row"><th>Payment</th><td>${escapeHtml(paymentLabel)}</td></tr>
          <tr class="lumin-order-confirm__tfoot-row lumin-order-confirm__tfoot-total"><th>Total</th><td><span class="amount">${escapeHtml(formatCurrency(order.total || 0))}</span></td></tr>
        `;

        root.querySelectorAll(".thank-you-customer-details").forEach((block) => {
          block.classList.add("lumin-order-confirm__address-card");
        });

        const { billing: billingAddr, shipping: shippingAddr } = pickBillingShipping(order);
        const { billing: billingEl, shipping: shippingEl } = findAddressElements(root);

        if (billingEl) {
          billingEl.classList.add("lumin-order-confirm__address");
          billingEl.innerHTML = buildAddressHtml(billingAddr, order.email);
        }
        if (shippingEl) {
          shippingEl.classList.add("lumin-order-confirm__address");
          const shipHtml = buildAddressHtml(shippingAddr, undefined);
          shippingEl.innerHTML =
            shipHtml && shipHtml !== "-"
              ? shipHtml
              : `<span class="text-muted">Same as billing</span>`;
        }

        let cta = root.querySelector(".lumin-order-confirm__cta");
        if (!cta) {
          cta = document.createElement("div");
          cta.className = "lumin-order-confirm__cta";
          detailsBlock?.insertAdjacentElement("afterend", cta);
        }
        const orderDetailsUrl = `/order-details/${encodeURIComponent(order.id)}`;
        cta.innerHTML = `<a class="btn btn-dark btn-sm rounded-3" href="${escapeHtml(orderDetailsUrl)}">View full order</a><a class="btn btn-outline-secondary btn-sm rounded-3 ms-2" href="/products">Continue shopping</a>`;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load order details.");
      }
    };

    void load();

    return () => {
      root.classList.remove("lumin-order-confirm");
      section?.classList.remove("lumin-order-confirm-section");
      root.querySelector(".lumin-order-confirm__cta")?.remove();
    };
  }, [orderId]);

  return null;
}
