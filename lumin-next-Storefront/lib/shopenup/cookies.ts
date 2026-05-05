import { cookies } from "next/headers";

/** Server-safe headers for store API (JWT optional). */
export async function getCompleteHeaders(): Promise<Record<string, string>> {
  const publishableKey = process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY?.trim() || "";
  const cookieStore = await cookies();
  const jwt = cookieStore.get("_shopenup_jwt")?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey;
  }
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }
  return headers;
}
