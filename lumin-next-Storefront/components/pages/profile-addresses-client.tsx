"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { listCustomerAddressesClient } from "@/lib/shopenup/customer";
import { getAuthHeadersClient } from "@/lib/shopenup/client-cookies";
import type { StoreCustomerAddress } from "@/lib/types/store-customer";

function formatCountry(code?: string | null): string {
  if (!code) return "";
  const c = code.toLowerCase();
  if (c === "in") return "India";
  if (c === "us") return "United States";
  return code.toUpperCase();
}

function formatAddressLines(addr: StoreCustomerAddress | null): string {
  if (!addr) return "";
  const lines = [
    [addr.first_name, addr.last_name].filter(Boolean).join(" ").trim(),
    (addr.company || "").trim(),
    [addr.address_1, addr.address_2].filter(Boolean).join(", ").trim(),
    [addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ").trim(),
    formatCountry(addr.country_code),
    addr.phone ? `Phone: ${addr.phone}` : "",
  ].filter((line) => line.length > 0);
  return lines.join("\n");
}

function pickBillingShipping(addresses: StoreCustomerAddress[]): {
  billing: StoreCustomerAddress | null;
  shipping: StoreCustomerAddress | null;
} {
  if (!addresses.length) {
    return { billing: null, shipping: null };
  }
  const byBilling = addresses.find((a) => a.is_default_billing);
  const byShipping = addresses.find((a) => a.is_default_shipping);
  const billing = byBilling ?? addresses[0] ?? null;
  const shipping = byShipping ?? byBilling ?? addresses[0] ?? null;
  return { billing, shipping };
}

function AddressesSurface({ children }: { children: ReactNode }) {
  return <div className="lumin-profile-addresses-wrap">{children}</div>;
}

function ProfileAddressesContent() {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<StoreCustomerAddress[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!("authorization" in getAuthHeadersClient())) {
      setAddresses([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const list = await listCustomerAddressesClient();
      setAddresses(list);
    } catch (e) {
      setAddresses([]);
      setError(e instanceof Error ? e.message : "Could not load addresses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!("authorization" in getAuthHeadersClient())) {
    return (
      <AddressesSurface>
        <div className="row">
          <div className="col-12">
            <p className="mb-2">
              <Link href="/login?next=/profile">Sign in</Link> to view your saved addresses.
            </p>
          </div>
        </div>
      </AddressesSurface>
    );
  }

  if (loading) {
    return (
      <AddressesSurface>
        <div className="row">
          <div className="col-12">
            <p className="text-secondary mb-0" role="status">
              Loading addresses…
            </p>
          </div>
        </div>
      </AddressesSurface>
    );
  }

  if (error) {
    return (
      <AddressesSurface>
        <div className="row">
          <div className="col-12">
            <p className="text-danger mb-2">{error}</p>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void load()}>
              Retry
            </button>
          </div>
        </div>
      </AddressesSurface>
    );
  }

  const { billing, shipping } = pickBillingShipping(addresses);
  const billingText = formatAddressLines(billing);
  const shippingText = formatAddressLines(shipping);

  return (
    <AddressesSurface>
      <div className="row">
        <div className="col-md-6">
          <div className="my-account-address__content">
            <h4 className="my-account-address__title">Billing address</h4>
            <Link className="my-account-address__edit" href="/checkout">
              Update in checkout
            </Link>
            <address className="fst-normal" style={{ whiteSpace: "pre-line" }}>
              {billingText || "No billing address saved yet."}
            </address>
          </div>
        </div>
        <div className="col-md-6">
          <div className="my-account-address__content">
            <h4 className="my-account-address__title">Shipping address</h4>
            <Link className="my-account-address__edit" href="/checkout">
              Update in checkout
            </Link>
            <address className="fst-normal" style={{ whiteSpace: "pre-line" }}>
              {shippingText || "No shipping address saved yet."}
            </address>
          </div>
        </div>
      </div>
    </AddressesSurface>
  );
}

export function ProfileAddressesMount() {
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const el = document.getElementById("lumin-profile-addresses-root");
    if (!el) return undefined;

    if (!rootRef.current) {
      rootRef.current = createRoot(el);
    }
    rootRef.current.render(<ProfileAddressesContent />);

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
    };
  }, []);

  return null;
}
