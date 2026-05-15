/**
 * Minimal Shopenup-compatible store client (public npm does not ship @shopenup/js-sdk).
 */

export type ClientFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | Array<string | number> | undefined>;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

/**
 * Store API base URL for `sdk.client.fetch` (publishable key header when set).
 * Prefer server env `SHOPENUP_BACKEND_URL`; use `NEXT_PUBLIC_SHOPENUP_BACKEND_URL` when the value must be available in the browser bundle.
 */
export const SHOPENUP_BACKEND_URL =
  process.env.SHOPENUP_BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL?.trim() ||
  "http://localhost:9000";

/** True when either env sets the API base (not relying on the localhost default). */
export function isExplicitShopenupBackendUrlSet(): boolean {
  return Boolean(
    process.env.SHOPENUP_BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL?.trim()
  );
}

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY || "";

function buildQueryString(query?: ClientFetchOptions["query"]): string {
  if (!query) {
    return "";
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, String(entry)));
      return;
    }
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function mergeHeaders(base: Record<string, string>, extra?: HeadersInit): Record<string, string> {
  const out = { ...base };
  if (!extra) {
    return out;
  }
  const h = new Headers(extra);
  h.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function clientFetch<T>(path: string, options: ClientFetchOptions = {}): Promise<T> {
  const { query, method, body, headers: initHeaders, cache, next } = options;
  const url = `${SHOPENUP_BACKEND_URL}${path}${buildQueryString(query)}`;

  const headers = mergeHeaders(
    {
      ...(PUBLISHABLE_KEY ? { "x-publishable-api-key": PUBLISHABLE_KEY } : {}),
    },
    initHeaders
  );

  if (body !== undefined && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: method || "GET",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache,
    next,
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    const msg = errBody.message || errBody.error;
    throw new Error(msg || `Request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!text?.trim()) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    if (contentType.includes("application/json")) {
      throw new Error(`Invalid JSON from ${path}`);
    }
    return undefined as T;
  }
}

export const sdk = {
  client: {
    fetch: clientFetch,
  },
  auth: {
    async login(
      actor: "customer",
      method: "emailpass",
      payload: { email: string; password: string }
    ): Promise<string | { location: string }> {
      const data = await clientFetch<{ token?: string; location?: string }>(
        `/auth/${actor}/${method}`,
        {
          method: "POST",
          body: payload,
          cache: "no-store",
        }
      );
      if (data?.location) {
        return { location: data.location };
      }
      if (!data?.token) {
        throw new Error("No authentication token returned.");
      }
      return data.token;
    },

    async register(
      actor: "customer",
      method: "emailpass",
      payload: { email: string; password: string }
    ): Promise<string> {
      const data = await clientFetch<{ token?: string }>(`/auth/${actor}/${method}/register`, {
        method: "POST",
        body: payload,
        cache: "no-store",
      });
      if (!data?.token) {
        throw new Error("No registration token returned.");
      }
      return data.token;
    },

    async logout(): Promise<void> {
      /* JWT cookie is cleared client-side */
    },

    async requestPasswordReset(
      actor: "customer",
      method: "emailpass",
      payload: { identifier: string }
    ): Promise<void> {
      await clientFetch(`/auth/${actor}/${method}/reset-password`, {
        method: "POST",
        body: payload,
        cache: "no-store",
      });
    },

    async updateProvider(
      actor: "customer",
      method: "emailpass",
      payload: { password: string },
      token: string
    ): Promise<void> {
      await clientFetch(`/auth/${actor}/${method}/update`, {
        method: "POST",
        body: payload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    },
  },
  store: {
    customer: {
      async create(
        body: { email: string; first_name: string; last_name: string; phone?: string },
        _query: Record<string, never>,
        headers: HeadersInit
      ): Promise<{ customer: unknown }> {
        return clientFetch<{ customer: unknown }>("/store/customers", {
          method: "POST",
          body,
          headers,
          cache: "no-store",
        });
      },
    },
    cart: {
      async transferCart(cartId: string, _query: Record<string, never>, headers: HeadersInit): Promise<unknown> {
        return clientFetch(`/store/carts/${cartId}/customer`, {
          method: "POST",
          headers,
          cache: "no-store",
        });
      },
    },
  },
};
