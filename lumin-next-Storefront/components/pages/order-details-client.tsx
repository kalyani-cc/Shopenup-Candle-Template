"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sdk } from "@/lib/config";
import { getCustomerClient } from "@/lib/shopenup/customer";
import { getCompleteHeadersClient } from "@/lib/shopenup/client-cookies";
import type { StoreCustomer } from "@/lib/types/store-customer";
import { collectPromoCodesFromOrder } from "@/lib/shopenup/order-promo-codes";
import { formatCurrency, formatOrderDisplayStatus } from "@/lib/utils";

type Address = {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  province?: string | null;
  country_code?: string | null;
  phone?: string | null;
};

type LineItem = {
  id: string;
  title?: string | null;
  product_title?: string | null;
  product_id?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total?: number | null;
  thumbnail?: string | null;
  adjustments?: Array<{ code?: string | null; amount?: number | null }> | null;
  variant?: { product?: { title?: string | null; thumbnail?: string | null } | null } | null;
};

type StoreOrderDetail = {
  id: string;
  display_id?: number | string;
  email?: string | null;
  status?: string | null;
  fulfillment_status?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
  total?: number | null;
  subtotal?: number | null;
  tax_total?: number | null;
  shipping_total?: number | null;
  discount_total?: number | null;
  shipping_address?: Address | null;
  billing_address?: Address | null;
  items?: LineItem[] | null;
  customer_id?: string | null;
  shipping_methods?: Array<{
    adjustments?: Array<{ code?: string | null; amount?: number | null }> | null;
  }> | null;
};

const ORDER_DETAIL_FIELDS =
  "id,display_id,email,status,fulfillment_status,payment_status,created_at,total,subtotal,tax_total,shipping_total,discount_total,customer_id," +
  "shipping_address.*,billing_address.*,items.*,items.product_id,items.product_title,items.title,items.thumbnail,items.total,items.unit_price,items.quantity," +
  "items.adjustments.*,items.variant.*,items.variant.product.*," +
  "shipping_methods.*,shipping_methods.adjustments.*";

function formatAddressBlock(a: Address | null | undefined): string {
  if (!a) return "";
  const lines = [
    [a.first_name, a.last_name].filter(Boolean).join(" ").trim(),
    a.company || "",
    [a.address_1, a.address_2].filter(Boolean).join(", "),
    [a.city, a.province, a.postal_code].filter(Boolean).join(", "),
    a.country_code || "",
    a.phone ? `Phone: ${a.phone}` : "",
  ]
    .map((l) => (l || "").trim())
    .filter(Boolean);
  return lines.join("\n");
}

function lineItemTitle(item: LineItem): string {
  return (
    item.product_title ||
    item.title ||
    item.variant?.product?.title ||
    "Product"
  );
}

function lineItemImage(item: LineItem): string | undefined {
  return item.thumbnail || item.variant?.product?.thumbnail || undefined;
}

function lineItemTotal(item: LineItem): number {
  const qty = item.quantity ?? 1;
  return item.total ?? (item.unit_price || 0) * qty;
}

type OrderDetailsClientProps = {
  orderId: string;
};

export function OrderDetailsClient({ orderId }: OrderDetailsClientProps) {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [customer, setCustomer] = useState<StoreCustomer | null>(null);
  const [order, setOrder] = useState<StoreOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setAuthLoading(true);
      const c = await getCustomerClient();
      if (!mounted) return;
      setCustomer(c);
      setAuthLoading(false);

      if (!c) {
        router.replace(`/login?next=${encodeURIComponent(`/order-details/${orderId}`)}`);
        return;
      }

      setLoading(true);
      setError("");
      try {
        let data: { order?: StoreOrderDetail };
        try {
          data = await sdk.client.fetch<{ order?: StoreOrderDetail }>(`/store/orders/${orderId}`, {
            method: "GET",
            headers: getCompleteHeadersClient(),
            query: { fields: ORDER_DETAIL_FIELDS },
            cache: "no-store",
          });
        } catch {
          data = await sdk.client.fetch<{ order?: StoreOrderDetail }>(`/store/orders/${orderId}`, {
            method: "GET",
            headers: getCompleteHeadersClient(),
            cache: "no-store",
          });
        }
        const o = data.order;
        if (!mounted) return;
        if (!o) {
          setOrder(null);
          setError("Order not found.");
          return;
        }
        if (o.customer_id && c.id && o.customer_id !== c.id) {
          setOrder(null);
          setError("You do not have access to this order.");
          return;
        }
        setOrder(o);
      } catch (e) {
        if (!mounted) return;
        setOrder(null);
        setError(e instanceof Error ? e.message : "Failed to load order.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [orderId, router]);

  if (authLoading) {
    return <p className="text-secondary mb-0">Checking your session…</p>;
  }

  if (!customer) {
    return <p className="text-secondary mb-0">Redirecting to sign in…</p>;
  }

  if (loading) {
    return <p className="text-secondary mb-0">Loading order…</p>;
  }

  if (error || !order) {
    return (
      <div className="alert alert-danger" role="alert">
        <p className="mb-2">{error || "Order not found."}</p>
        <Link href="/profile" className="alert-link">
          Back to my account
        </Link>
      </div>
    );
  }

  const ship = formatAddressBlock(order.shipping_address || undefined);
  const bill = formatAddressBlock(order.billing_address || undefined);
  const items = order.items || [];
  const promoCodes = collectPromoCodesFromOrder(order);

  return (
    <div className="order-details-storefront">
      <div className="mb-4">
        <Link href="/profile" className="btn btn-outline-secondary btn-sm">
          ← Back to my account
        </Link>
      </div>

      <div className="card border shadow-sm mb-4">
        <div className="card-body p-4 p-lg-5">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-4">
            <div className="flex-grow-1 min-w-0">
              <p className="text-uppercase small text-secondary mb-2 fw-semibold">Order</p>
              <h2 className="h3 mb-2">#{order.display_id ?? order.id}</h2>
              <p className="text-secondary mb-1 fs-6">
                Placed{" "}
                {order.created_at
                  ? new Date(order.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </p>
              {order.email ? <p className="text-secondary mb-0 fs-6">{order.email}</p> : null}
            </div>
            <div className="flex-shrink-0 text-md-end lumin-order-status-col">
              <p className="text-uppercase small text-secondary mb-2 fw-semibold">Status</p>
              <p className="fs-5 fw-semibold mb-1 text-capitalize">{formatOrderDisplayStatus(order)}</p>
              {order.payment_status ? (
                <p className="text-secondary mb-0 fs-6">
                  Payment: <span className="text-capitalize">{order.payment_status}</span>
                </p>
              ) : null}
            </div>
          </div>

          <hr className="my-4" />

          <div className="row g-4">
            <div className="col-md-6">
              <h3 className="h6 fw-semibold mb-3">Shipping address</h3>
              <address
                className="mb-0 fs-6 text-secondary lh-lg rounded border bg-light p-3 fst-normal"
                style={{ whiteSpace: "pre-line" }}
              >
                {ship || "—"}
              </address>
            </div>
            <div className="col-md-6">
              <h3 className="h6 fw-semibold mb-3">Billing address</h3>
              <address
                className="mb-0 fs-6 text-secondary lh-lg rounded border bg-light p-3 fst-normal"
                style={{ whiteSpace: "pre-line" }}
              >
                {bill || ship || "—"}
              </address>
            </div>
          </div>
        </div>
      </div>

      <div className="card border shadow-sm">
        <div className="card-body p-4 p-lg-5">
          <h3 className="h5 fw-semibold mb-4">Items</h3>
          {items.length ? (
            <ul className="list-unstyled mb-0">
              {items.map((item) => {
                const title = lineItemTitle(item);
                const image = lineItemImage(item);
                const qty = item.quantity ?? 1;
                const total = lineItemTotal(item);
                return (
                  <li
                    key={item.id}
                    className="d-flex align-items-center justify-content-between gap-3 py-3 px-2 px-sm-3 rounded lumin-order-line-item"
                  >
                    <div className="d-flex align-items-center gap-3 min-w-0 flex-grow-1">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote product URLs vary by backend
                        <img
                          src={image}
                          alt=""
                          width={72}
                          height={72}
                          className="rounded border flex-shrink-0 object-fit-cover bg-white"
                          style={{ width: "72px", height: "72px" }}
                        />
                      ) : (
                        <div
                          className="rounded border bg-light flex-shrink-0 d-flex align-items-center justify-content-center text-secondary small"
                          style={{ width: "72px", height: "72px" }}
                          aria-hidden
                        >
                          —
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="mb-1 fw-semibold fs-6 text-truncate" title={title}>
                          {title}
                        </p>
                        <p className="mb-0 text-secondary">Qty: {qty}</p>
                      </div>
                    </div>
                    <p className="mb-0 fw-semibold fs-5 flex-shrink-0">{formatCurrency(total)}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-secondary mb-0">No line items for this order.</p>
          )}

          <div className="mt-4 pt-4 border-top fs-6">
            {order.subtotal != null ? (
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
            ) : null}
            {promoCodes.length ? (
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Promo code{promoCodes.length > 1 ? "s" : ""}</span>
                <span className="text-break text-end ms-2">{promoCodes.join(", ")}</span>
              </div>
            ) : null}
            {order.discount_total != null && order.discount_total > 0 ? (
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Discount</span>
                <span>−{formatCurrency(order.discount_total)}</span>
              </div>
            ) : null}
            {order.shipping_total != null ? (
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping_total)}</span>
              </div>
            ) : null}
            {order.tax_total != null ? (
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Tax</span>
                <span>{formatCurrency(order.tax_total)}</span>
              </div>
            ) : null}
            <div className="d-flex justify-content-between fw-semibold fs-6 pt-2 mt-2 border-top">
              <span>Total</span>
              <span>{formatCurrency(order.total ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
