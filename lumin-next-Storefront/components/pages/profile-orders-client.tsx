"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { sdk } from "@/lib/config";
import { getAuthHeadersClient, getCompleteHeadersClient } from "@/lib/shopenup/client-cookies";
import { formatCurrency, formatOrderDisplayStatus } from "@/lib/utils";

type StoreOrder = {
  id: string;
  display_id?: number;
  status?: string;
  fulfillment_status?: string | null;
  payment_status?: string | null;
  created_at?: string;
  total?: number;
  items?: Array<{ id: string; quantity?: number }>;
};

function formatOrderDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function itemCount(order: StoreOrder): number {
  const items = order.items;
  if (!items?.length) return 0;
  return items.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0) || items.length;
}

function OrdersTableSurface({ children }: { children: ReactNode }) {
  return (
    <div className="my-account-table table-responsive lumin-profile-orders-wrap">{children}</div>
  );
}

function ProfileOrdersTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<StoreOrder[]>([]);

  const load = useCallback(async () => {
    if (!("authorization" in getAuthHeadersClient())) {
      setOrders([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await sdk.client.fetch<{ orders?: StoreOrder[] }>("/store/orders", {
        method: "GET",
        headers: getCompleteHeadersClient(),
        query: {
          limit: 25,
          order: "-created_at",
        },
        cache: "no-store",
      });
      setOrders(res?.orders || []);
    } catch (e) {
      setOrders([]);
      setError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!("authorization" in getAuthHeadersClient())) {
    return (
      <OrdersTableSurface>
        <p className="px-2 py-4 mb-0 text-secondary">
          <Link href="/login?next=/profile">Sign in</Link> to see your orders.
        </p>
      </OrdersTableSurface>
    );
  }

  if (loading) {
    return (
      <OrdersTableSurface>
        <p className="px-2 py-4 mb-0 text-secondary" role="status">
          Loading orders…
        </p>
      </OrdersTableSurface>
    );
  }

  if (error) {
    return (
      <OrdersTableSurface>
        <p className="px-2 py-4 mb-0 text-danger">{error}</p>
        <button type="button" className="btn btn-sm btn-outline-secondary ms-2 mb-3" onClick={() => void load()}>
          Retry
        </button>
      </OrdersTableSurface>
    );
  }

  if (!orders.length) {
    return (
      <OrdersTableSurface>
        <p className="px-2 py-4 mb-0 text-secondary">You have no orders yet.</p>
      </OrdersTableSurface>
    );
  }

  return (
    <OrdersTableSurface>
      <table className="table">
        <thead>
          <tr>
            <th>
              <span>Order</span>
            </th>
            <th>
              <span>Date</span>
            </th>
            <th>
              <span>Status</span>
            </th>
            <th>
              <span>Total</span>
            </th>
            <th>
              <span>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const count = itemCount(order);
            const label = order.display_id != null ? `#${order.display_id}` : `#${order.id.slice(-8)}`;
            return (
              <tr key={order.id}>
                <td>
                  <span>{label}</span>
                </td>
                <td>
                  <time dateTime={order.created_at}>{formatOrderDate(order.created_at)}</time>
                </td>
                <td>{formatOrderDisplayStatus(order)}</td>
                <td>
                  <span>{formatCurrency(order.total || 0)}</span>
                  {count > 0 ? ` for ${count} item${count === 1 ? "" : "s"}` : ""}
                </td>
                <td>
                  <Link className="btn" href={`/order-details/${encodeURIComponent(order.id)}`}>
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </OrdersTableSurface>
  );
}

export function ProfileOrdersMount() {
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const el = document.getElementById("lumin-profile-orders-root");
    if (!el) return undefined;

    if (!rootRef.current) {
      rootRef.current = createRoot(el);
    }
    rootRef.current.render(<ProfileOrdersTable />);

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
    };
  }, []);

  return null;
}
