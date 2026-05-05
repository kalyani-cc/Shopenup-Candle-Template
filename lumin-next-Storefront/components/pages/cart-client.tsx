"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addToCart,
  removeCartItem,
  retrieveCart,
  type StoreCart,
  updateCartItem
} from "@/lib/shopenup/cart";
import { formatCurrency } from "@/lib/utils";

type CartClientProps = {
  initialAddVariant?: string | null;
};

export function CartClient({ initialAddVariant }: CartClientProps) {
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const next = await retrieveCart();
      setCart(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!initialAddVariant) {
        return;
      }
      try {
        await addToCart(initialAddVariant, 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add product to cart.");
      } finally {
        await load();
      }
    };
    void run();
  }, [initialAddVariant]);

  const subtotal = useMemo(() => {
    if (cart?.subtotal != null) {
      return cart.subtotal;
    }
    if (!cart?.items?.length) {
      return 0;
    }
    return cart.items.reduce((sum, item) => {
      const lineTotal = item.total ?? item.subtotal ?? (item.unit_price || 0) * item.quantity;
      return sum + lineTotal;
    }, 0);
  }, [cart]);
  const taxTotal = cart?.tax_total ?? 0;
  const shippingTotal = cart?.shipping_total ?? 0;
  const grandTotal = cart?.total ?? Math.max(0, subtotal + taxTotal + shippingTotal);

  if (loading) {
    return (
      <section className="container-fluid custom-container py-14">
        <p className="mb-0">Loading cart...</p>
      </section>
    );
  }

  if (!cart || !cart.items.length) {
    return (
      <section className="container-fluid custom-container py-5">
        <div className="border rounded-1 bg-white p-4">
          <h2 className="h4 mb-2">Your cart is empty</h2>
          {error ? <p className="small text-danger mb-2">{error}</p> : null}
          <Link href="/products" className="btn btn-outline-dark btn-sm">
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-fluid custom-container py-5">
      <div className="row g-4">
        
        {/* LEFT - CART ITEMS */}
        <div className="col-lg-8">
          <h2 className="mb-4 fw-semibold">Shopping Cart</h2>
  
          {cart.items.map((item) => (
            <div key={item.id} className="card border-0 shadow-sm mb-3 p-3">
              <div className="row align-items-center">
  
                {/* IMAGE */}
                <div className="col-md-3 text-center">
                  <img
                    src={item.thumbnail || ""}
                    alt={item.title || "Item"}
                    className="img-fluid rounded"
                    style={{ maxHeight: "100px", objectFit: "cover" }}
                  />
                </div>
  
                {/* DETAILS */}
                <div className="col-md-6">
                  <h5 className="mb-1">{item.title}</h5>
                  <p className="text-muted small mb-2">
                    Price: {formatCurrency(item.unit_price || 0)}
                  </p>
                  <p className="text-muted small mb-1">Qty: {item.quantity}</p>
  
                  {/* QUANTITY CONTROLS */}
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm px-1 py-0 border-0 bg-transparent"
                      style={{ minWidth: "24px", height: "24px", lineHeight: 1, fontSize: "16px" }}
                      onClick={async () => {
                        const qty = Math.max(1, item.quantity - 1);
                        const updated = await updateCartItem(item.id, qty);
                        setCart(updated);
                      }}
                    >
                      -
                    </button>
  
                    <button
                      type="button"
                      className="btn btn-sm px-1 py-0 border-0 bg-transparent"
                      style={{ minWidth: "24px", height: "24px", lineHeight: 1, fontSize: "16px" }}
                      onClick={async () => {
                        const updated = await updateCartItem(item.id, item.quantity + 1);
                        setCart(updated);
                      }}
                    >
                      +
                    </button>
  
                    <button
                      type="button"
                      className="btn btn-sm text-danger ms-1 px-1 py-0 border-0 bg-transparent"
                      onClick={async () => {
                        const updated = await removeCartItem(item.id);
                        setCart(updated);
                      }}
                      aria-label="Remove item"
                      title="Remove item"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
  
                {/* PRICE */}
                <div className="col-md-3 text-md-end mt-3 mt-md-0">
                  <h6 className="fw-bold">
                    {formatCurrency(
                      item.total ??
                        item.subtotal ??
                        (item.unit_price || 0) * item.quantity
                    )}
                  </h6>
                </div>
  
              </div>
            </div>
          ))}
        </div>
  
        {/* RIGHT - SUMMARY */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 sticky-top" style={{ top: "120px" }}>
            <h4 className="mb-3">Order Summary</h4>
  
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
  
            <div className="d-flex justify-content-between mb-2 text-muted small">
              <span>Shipping</span>
              <span>{formatCurrency(shippingTotal)}</span>
            </div>
  
            <div className="d-flex justify-content-between mb-2 text-muted small">
              <span>Tax</span>
              <span>{formatCurrency(taxTotal)}</span>
            </div>
  
            <hr />
  
            <div className="d-flex justify-content-between fw-bold mb-3">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
  
            {error && (
              <p className="text-danger small">{error}</p>
            )}
  
            <Link href="/checkout" className="btn btn-dark btn-sm w-100 mb-2 py-2">
              Proceed to Checkout
            </Link>
  
            <Link href="/products" className="btn btn-outline-secondary btn-sm w-100 py-2">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

