"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createRoot, type Root } from "react-dom/client";
import type { StoreCustomer } from "@/lib/types/store-customer";
import { getCustomerClient, updateCustomerProfile } from "@/lib/shopenup/customer";
import { getAuthHeadersClient } from "@/lib/shopenup/client-cookies";

function ProfileAccountDetailForm() {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<StoreCustomer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const c = await getCustomerClient();
      setCustomer(c);
      if (!c && typeof window !== "undefined" && "authorization" in getAuthHeadersClient()) {
        setMessage("Could not load your profile. Try signing in again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!customer) {
      setIsEditing(false);
    }
  }, [customer]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) return;
    setMessage("");
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const first_name = String(form.get("first_name") || "").trim();
    const last_name = String(form.get("last_name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    try {
      const result = await updateCustomerProfile({ first_name, last_name, phone });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setCustomer(result.customer);
      setMessage("Profile updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="mb-0 text-secondary px-1 py-3" role="status">
        Loading your account…
      </p>
    );
  }

  if (!customer) {
    return (
      <div className="single-form">
        <p className="mb-3">Sign in to view and edit your account details.</p>
        <Link href="/login?next=/profile" className="single-form__btn btn">
          Sign in
        </Link>
      </div>
    );
  }

  if (isEditing) {
    return (
      <form onSubmit={onSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="single-form mb-0">
              <label className="single-form__label" htmlFor="profile-first-name">
                First Name
              </label>
              <input
                id="profile-first-name"
                name="first_name"
                className="single-form__input"
                type="text"
                required
                defaultValue={customer.first_name || ""}
                placeholder="First name"
                autoComplete="given-name"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="single-form mb-0">
              <label className="single-form__label" htmlFor="profile-last-name">
                Last Name
              </label>
              <input
                id="profile-last-name"
                name="last_name"
                className="single-form__input"
                type="text"
                required
                defaultValue={customer.last_name || ""}
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="single-form mb-0">
              <label className="single-form__label" htmlFor="profile-email">
                Email
              </label>
              <input
                id="profile-email"
                name="email"
                className="single-form__input bg-light text-secondary"
                type="email"
                value={customer.email}
                disabled
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="single-form mb-0">
              <label className="single-form__label" htmlFor="profile-phone">
                Phone
              </label>
              <input
                id="profile-phone"
                name="phone"
                className="single-form__input"
                type="tel"
                defaultValue={customer.phone || ""}
                placeholder="Phone number"
                autoComplete="tel"
              />
            </div>
          </div>
        </div>
        {message ? (
          <p className={`small mt-3 mb-0 ${message.includes("success") ? "text-success" : "text-danger"}`}>{message}</p>
        ) : null}
        <div className="single-form d-flex flex-wrap gap-2 mt-4 mb-0">
          <button className="single-form__btn btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="single-form__btn btn btn-outline-secondary"
            disabled={saving}
            onClick={() => {
              setMessage("");
              setIsEditing(false);
              void load();
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h2 className="h5 mb-0">Profile info</h2>
        <button
          type="button"
          className="single-form__btn btn"
          onClick={() => {
            setMessage("");
            setIsEditing(true);
          }}
        >
          Edit profile
        </button>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <p className="small text-secondary fw-semibold mb-2">First Name</p>
          <p className="rounded border bg-light px-3 py-2 small mb-0">{customer.first_name || "Not provided"}</p>
        </div>
        <div className="col-md-6">
          <p className="small text-secondary fw-semibold mb-2">Last Name</p>
          <p className="rounded border bg-light px-3 py-2 small mb-0">{customer.last_name || "Not provided"}</p>
        </div>
        <div className="col-md-6">
          <p className="small text-secondary fw-semibold mb-2">Email</p>
          <p className="rounded border bg-light px-3 py-2 small mb-0 text-break">{customer.email}</p>
        </div>
        <div className="col-md-6">
          <p className="small text-secondary fw-semibold mb-2">Phone</p>
          <p className="rounded border bg-light px-3 py-2 small mb-0">{customer.phone || "Not provided"}</p>
        </div>
      </div>

      {!isEditing && message ? (
        <p className={`small mt-3 mb-0 ${message.includes("success") ? "text-success" : "text-danger"}`}>{message}</p>
      ) : null}
    </div>
  );
}

export function ProfileAccountDetailMount() {
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const el = document.getElementById("lumin-profile-account-detail-root");
    if (!el) return undefined;

    if (!rootRef.current) {
      rootRef.current = createRoot(el);
    }
    rootRef.current.render(<ProfileAccountDetailForm />);

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
    };
  }, []);

  return null;
}
