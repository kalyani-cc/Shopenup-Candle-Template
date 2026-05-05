const JWT_COOKIE = "_shopenup_jwt";
const CART_COOKIE = "_shopenup_cart_id";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") {
    return;
  }
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
}

export function getAuthHeadersClient(): Record<string, string> {
  const token = readCookie(JWT_COOKIE);
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function getCompleteHeadersClient(): Record<string, string> {
  const publishableKey = process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY || "";
  return {
    ...getAuthHeadersClient(),
    ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
    "Content-Type": "application/json",
  };
}

export function setAuthToken(token: string): void {
  writeCookie(JWT_COOKIE, token, 7);
}

export function removeAuthToken(): void {
  removeCookie(JWT_COOKIE);
}

export function getCartId(): string | undefined {
  let cartId = readCookie(CART_COOKIE);
  if (!cartId && typeof window !== "undefined") {
    const legacy = window.localStorage.getItem("lumin_next_cart_id");
    if (legacy) {
      setCartId(legacy);
      cartId = legacy;
    }
  }
  return cartId;
}

export function setCartId(cartId: string): void {
  writeCookie(CART_COOKIE, cartId, 7);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("lumin_next_cart_id", cartId);
  }
}

export function removeCartId(): void {
  removeCookie(CART_COOKIE);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("lumin_next_cart_id");
  }
}
