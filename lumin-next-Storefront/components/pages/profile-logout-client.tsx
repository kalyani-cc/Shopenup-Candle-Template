"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { logoutCustomer } from "@/lib/shopenup/customer";

function ProfileLogoutButton() {
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await logoutCustomer();
    } finally {
      if (!mountedRef.current) return;
      // This component is mounted via createRoot() outside Next's App Router tree,
      // so we can't use next/navigation hooks here.
      window.location.assign("/login");
    }
  };

  return (
    <button type="button" className="account-btn" onClick={() => void onLogout()} disabled={loading}>
      {loading ? "Logging out…" : "Logout"}
    </button>
  );
}

export function ProfileLogoutMount() {
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const el = document.getElementById("lumin-profile-logout-root");
    if (!el) return undefined;

    if (!rootRef.current) {
      rootRef.current = createRoot(el);
    }
    rootRef.current.render(<ProfileLogoutButton />);

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
    };
  }, []);

  return null;
}

