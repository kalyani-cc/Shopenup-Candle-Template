export function formatCurrency(value: number): string {
  const region = process.env.NEXT_PUBLIC_DEFAULT_REGION?.toLowerCase() || "in";
  const currency = region === "us" ? "USD" : "INR";
  const locale = region === "us" ? "en-US" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/** Customer-facing status (fulfillment first, then payment, then workflow status). */
export function formatOrderDisplayStatus(order: {
  fulfillment_status?: string | null;
  payment_status?: string | null;
  status?: string | null;
}): string {
  const raw = (order.fulfillment_status || "").trim().toLowerCase().replace(/-/g, "_");
  switch (raw) {
    case "delivered":
      return "Delivered";
    case "shipped":
      return "Shipped";
    case "fulfilled":
      return "Fulfilled";
    case "partially_fulfilled":
      return "Partially fulfilled";
    case "not_fulfilled":
      return "Unfulfilled";
    case "canceled":
    case "cancelled":
      return "Cancelled";
    case "":
      break;
    default:
      if (raw) {
        return raw.replace(/_/g, " ");
      }
  }

  const pay = (order.payment_status || "").trim().toLowerCase();
  if (pay === "awaiting" || pay === "pending" || pay === "not_paid") {
    return "Payment pending";
  }

  const st = (order.status || "").trim().toLowerCase();
  if (st === "completed") {
    return "Confirmed";
  }
  if (st) {
    return st.replace(/_/g, " ");
  }
  return "Processing";
}
