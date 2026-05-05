"use client";

import { useEffect, useMemo, useState } from "react";

type ToastType = "success" | "info" | "error";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastEventDetail = {
  message: string;
  type?: ToastType;
};

const TOAST_EVENT_NAME = "lumin_next:toast";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<ToastEventDetail>;
      const message = custom.detail?.message?.trim();
      if (!message) {
        return;
      }

      const nextToast: ToastItem = {
        id: createId(),
        message,
        type: custom.detail?.type || "success"
      };

      setToasts((prev) => [...prev, nextToast]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== nextToast.id));
      }, 2200);
    };

    window.addEventListener(TOAST_EVENT_NAME, onToast as EventListener);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, onToast as EventListener);
    };
  }, []);

  const hasToasts = useMemo(() => toasts.length > 0, [toasts.length]);
  if (!hasToasts) {
    return null;
  }

  return (
    <div className="lumin-toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`lumin-toast lumin-toast--${toast.type}`} role="status">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
