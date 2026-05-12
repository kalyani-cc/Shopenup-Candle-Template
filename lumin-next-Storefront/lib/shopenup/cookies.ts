import { cookies } from "next/headers";

const SHOPENUP_JWT_COOKIE = "_shopenup_jwt";

/**
 * Read JWT from the storefront cookie string. Store API expects `Authorization: Bearer`,
 * not this cookie name, so proxies should map it when forwarding to the backend.
 */
export function parseShopenupJwtFromCookieHeader(
  cookieHeader: string | null | undefined
): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const prefix = `${SHOPENUP_JWT_COOKIE}=`;
  for (const p of parts) {
    if (p.startsWith(prefix)) {
      const raw = p.slice(prefix.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return undefined;
}

/** Server-safe headers for store API (JWT optional). */
export async function getCompleteHeaders(): Promise<Record<string, string>> {
  const publishableKey = process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY?.trim() || "";
  const cookieStore = await cookies();
  const jwt = cookieStore.get(SHOPENUP_JWT_COOKIE)?.value;

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
