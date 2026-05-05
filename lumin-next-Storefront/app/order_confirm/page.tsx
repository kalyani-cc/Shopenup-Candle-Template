import { redirect } from "next/navigation";

type Search = Record<string, string | string[] | undefined>;

function toQueryString(searchParams: Search): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => qs.append(key, String(entry)));
    } else {
      qs.set(key, String(value));
    }
  }
  return qs.toString();
}

/** Legacy / template URLs use `order_confirm`; the app route is `/order-confirm`. */
export default function OrderConfirmUnderscorePage({ searchParams }: { searchParams: Search }) {
  const q = toQueryString(searchParams);
  redirect(q ? `/order-confirm?${q}` : "/order-confirm");
}
