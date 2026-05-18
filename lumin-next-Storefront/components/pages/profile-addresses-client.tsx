"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TrashBinIcon } from "@/components/ui/trash-bin-icon";
import {
  createCustomerAddressClient,
  deleteCustomerAddressClient,
  listCustomerAddressesClient,
  updateCustomerAddressClient,
  type CustomerAddressInput,
} from "@/lib/shopenup/customer";
import { getAuthHeadersClient } from "@/lib/shopenup/client-cookies";
import type { StoreCustomerAddress } from "@/lib/types/store-customer";

const COUNTRY_OPTIONS = [
  { code: "in", label: "India" },
  { code: "us", label: "United States" },
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Puducherry",
];

const US_STATES = [
  "California",
  "New York",
  "Texas",
  "Florida",
  "Illinois",
  "Washington",
  "Georgia",
  "Ohio",
];

function getStatesByCountry(countryCode: string): string[] {
  return countryCode === "us" ? US_STATES : INDIAN_STATES;
}

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

const emptyForm = (): CustomerAddressInput => ({
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  postal_code: "",
  province: "",
  country_code: "in",
  phone: "",
  is_default_billing: false,
  is_default_shipping: false,
});

function addressToForm(addr: StoreCustomerAddress): CustomerAddressInput {
  return {
    first_name: addr.first_name || "",
    last_name: addr.last_name || "",
    company: addr.company || "",
    address_1: addr.address_1 || "",
    address_2: addr.address_2 || "",
    city: addr.city || "",
    postal_code: addr.postal_code || "",
    province: addr.province || "",
    country_code: (addr.country_code || "in").toLowerCase(),
    phone: addr.phone || "",
    is_default_billing: Boolean(addr.is_default_billing),
    is_default_shipping: Boolean(addr.is_default_shipping),
  };
}

function AddressesSurface({ children }: { children: ReactNode }) {
  return <div className="lumin-profile-addresses-wrap">{children}</div>;
}

function AddressForm({
  initial,
  submitLabel,
  busy,
  onCancel,
  onSubmit,
}: {
  initial: CustomerAddressInput;
  submitLabel: string;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (values: CustomerAddressInput) => void;
}) {
  const [form, setForm] = useState(initial);
  const states = getStatesByCountry(form.country_code);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const set = (key: keyof CustomerAddressInput, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="lumin-address-form" onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">First name *</label>
          <input
            className="form-control"
            required
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last name *</label>
          <input
            className="form-control"
            required
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
          />
        </div>
        <div className="col-12">
          <label className="form-label">Company (optional)</label>
          <input
            className="form-control"
            value={form.company || ""}
            onChange={(e) => set("company", e.target.value)}
          />
        </div>
        <div className="col-12">
          <label className="form-label">Street address *</label>
          <input
            className="form-control mb-2"
            required
            placeholder="House number and street name"
            value={form.address_1}
            onChange={(e) => set("address_1", e.target.value)}
          />
          <input
            className="form-control"
            placeholder="Apartment, suite, etc. (optional)"
            value={form.address_2 || ""}
            onChange={(e) => set("address_2", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">City *</label>
          <input
            className="form-control"
            required
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">State *</label>
          <select
            className="form-select"
            required
            value={form.province || ""}
            onChange={(e) => set("province", e.target.value)}
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Postcode *</label>
          <input
            className="form-control"
            required
            value={form.postal_code}
            onChange={(e) => set("postal_code", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Country *</label>
          <select
            className="form-select"
            required
            value={form.country_code}
            onChange={(e) => {
              const code = e.target.value;
              setForm((prev) => ({
                ...prev,
                country_code: code,
                province: getStatesByCountry(code)[0] || "",
              }));
            }}
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input
            className="form-control"
            type="tel"
            value={form.phone || ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="col-12">
          <label className="lumin-address-form__check">
            <input
              type="checkbox"
              checked={Boolean(form.is_default_billing)}
              onChange={(e) => set("is_default_billing", e.target.checked)}
            />
            Default billing address
          </label>
          <label className="lumin-address-form__check ms-3">
            <input
              type="checkbox"
              checked={Boolean(form.is_default_shipping)}
              onChange={(e) => set("is_default_shipping", e.target.checked)}
            />
            Default shipping address
          </label>
        </div>
      </div>
      <div className="lumin-address-form__actions">
        <button type="submit" className="btn btn-sm btn-primary" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProfileAddressesContent() {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<StoreCustomerAddress[]>([]);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState<"none" | "add" | "edit">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<CustomerAddressInput>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const openAdd = () => {
    setFormInitial(emptyForm());
    setEditingId(null);
    setFormMode("add");
  };

  const openEdit = (addr: StoreCustomerAddress) => {
    setFormInitial(addressToForm(addr));
    setEditingId(addr.id);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode("none");
    setEditingId(null);
  };

  const handleSave = async (values: CustomerAddressInput) => {
    setSaving(true);
    setError("");
    try {
      if (formMode === "edit" && editingId) {
        const res = await updateCustomerAddressClient(editingId, values);
        if (!res.ok) {
          setError(res.error);
          return;
        }
      } else {
        const res = await createCustomerAddressClient(values);
        if (!res.ok) {
          setError(res.error);
          return;
        }
      }
      closeForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await deleteCustomerAddressClient(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (editingId === id) closeForm();
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  if (!("authorization" in getAuthHeadersClient())) {
    return (
      <AddressesSurface>
        <p className="mb-2">
          <Link href="/login?next=/profile">Sign in</Link> to manage your saved addresses.
        </p>
      </AddressesSurface>
    );
  }

  if (loading) {
    return (
      <AddressesSurface>
        <p className="text-secondary mb-0" role="status">
          Loading addresses…
        </p>
      </AddressesSurface>
    );
  }

  return (
    <AddressesSurface>
      <div className="lumin-profile-addresses__header">
        <h4 className="my-account-address__title mb-0">Saved addresses</h4>
        {formMode === "none" && (
          <button type="button" className="btn btn-sm btn-primary" onClick={openAdd}>
            Add address
          </button>
        )}
      </div>

      {error && (
        <p className="text-danger small mb-3" role="alert">
          {error}
        </p>
      )}

      {formMode !== "none" && (
        <div className="lumin-address-form-panel mb-4">
          <h5 className="mb-3">{formMode === "edit" ? "Edit address" : "Add new address"}</h5>
          <AddressForm
            initial={formInitial}
            submitLabel={formMode === "edit" ? "Update address" : "Save address"}
            busy={saving}
            onCancel={closeForm}
            onSubmit={(v) => void handleSave(v)}
          />
        </div>
      )}

      {!addresses.length && formMode === "none" ? (
        <p className="text-secondary mb-0">No addresses saved yet. Click &quot;Add address&quot; to add one.</p>
      ) : (
        <div className="row g-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="col-md-6">
              <div className="lumin-address-card">
                <address className="lumin-address-card__body" style={{ whiteSpace: "pre-line" }}>
                  {formatAddressLines(addr)}
                </address>
                <div className="lumin-address-card__badges">
                  {addr.is_default_billing && <span className="badge bg-secondary">Billing</span>}
                  {addr.is_default_shipping && <span className="badge bg-secondary">Shipping</span>}
                </div>
                <div className="lumin-address-card__actions">
                  <button
                    type="button"
                    className="lumin-address-card__icon-btn"
                    onClick={() => openEdit(addr)}
                    disabled={Boolean(deletingId)}
                    aria-label="Edit address"
                    title="Edit address"
                  >
                    <i className="lastudioicon-d-edit" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="lumin-address-card__icon-btn lumin-address-card__icon-btn--danger"
                    onClick={() => void handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    aria-label="Delete address"
                    title="Delete address"
                  >
                    <TrashBinIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
