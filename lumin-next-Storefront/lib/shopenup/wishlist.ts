"use client";

import type { Product } from "@/lib/store-data";
import { sdk } from "@/lib/config";
import {
  getAuthHeadersClient,
  getCompleteHeadersClient,
  removeAuthToken
} from "@/lib/shopenup/client-cookies";

const GUEST_WISHLIST_KEY = "lumin_next_guest_wishlist";

export type FavouriteProduct = Product & {
  variantId?: string;
  wishlistItemId?: string;
};

type WishlistItem = {
  id: string;
  product_variant_id?: string;
  product_variant?: {
    id?: string;
    title?: string;
    prices?: Array<{ amount?: number }>;
    product?: {
      id?: string;
      handle?: string;
      title?: string;
      description?: string;
      thumbnail?: string;
      collection?: { handle?: string; title?: string };
    };
  };
};

type WishlistResponse = {
  wishlist?: {
    id: string;
    items?: WishlistItem[];
  };
};

function emitWishlistChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lumin_next:wishlist_changed"));
  }
}

function emitToast(message: string, type: "success" | "info" | "error" = "success") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lumin_next:toast", { detail: { message, type } }));
  }
}

function slugify(value?: string): string {
  if (!value) return "uncategorized";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function readGuestWishlist(): FavouriteProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavouriteProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(items: FavouriteProduct[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
}

function isUnauthorizedError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  return lower.includes("401") || lower.includes("unauthorized");
}

function isAlreadyHasWishlistError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  return lower.includes("already has a wishlist");
}

function addGuestWishlistItemIfMissing(product: Product): void {
  if (!product.variantId) return;
  const items = readGuestWishlist();
  if (!items.some((item) => item.variantId === product.variantId)) {
    writeGuestWishlist([...items, product]);
    emitWishlistChanged();
    emitToast("Item added to wishlist");
  }
}

const WISHLIST_LIST_FIELDS =
  "items.id,items.product_variant_id,items.*product_variant.id,items.*product_variant.title,items.*product_variant.*prices,items.*product_variant.*product,items.*product_variant.*product.collection";

async function fetchWishlistGet(
  query?: Record<string, string>
): Promise<{ wishlist: WishlistResponse["wishlist"] | null; unauthorized: boolean }> {
  try {
    const res = await sdk.client.fetch<WishlistResponse>("/store/customers/me/wishlists", {
      method: "GET",
      headers: getCompleteHeadersClient(),
      ...(query ? { query } : {}),
      cache: "no-store"
    });
    return { wishlist: res.wishlist ?? null, unauthorized: false };
  } catch (e) {
    if (isUnauthorizedError(e)) {
      removeAuthToken();
      return { wishlist: null, unauthorized: true };
    }
    return { wishlist: null, unauthorized: false };
  }
}

async function getWishlistFromApi(): Promise<WishlistResponse["wishlist"] | null> {
  const authHeaders = getAuthHeadersClient();
  if (!("authorization" in authHeaders)) {
    return null;
  }
  const first = await fetchWishlistGet({ fields: WISHLIST_LIST_FIELDS });
  if (first.unauthorized) return null;
  if (first.wishlist) return first.wishlist;
  // Some backends reject or mishandle custom `fields`; full payload still maps via mapWishlistItem.
  const second = await fetchWishlistGet();
  if (second.unauthorized) return null;
  return second.wishlist;
}

async function ensureWishlistExists(): Promise<void> {
  const authHeaders = getAuthHeadersClient();
  if (!("authorization" in authHeaders)) {
    return;
  }
  let postError: Error | undefined;
  try {
    // Create first to avoid noisy "No wishlist found" 404 on initial GET.
    await sdk.client.fetch("/store/customers/me/wishlists", {
      method: "POST",
      headers: getCompleteHeadersClient(),
      cache: "no-store"
    });
    return;
  } catch (e) {
    if (isUnauthorizedError(e)) {
      removeAuthToken();
      return;
    }
    // Backend may respond with a 404 but message "Customer already has a wishlist".
    // Treat that as success and fall through to GET verification.
    if (isAlreadyHasWishlistError(e)) {
      return;
    }
    postError = e instanceof Error ? e : new Error(String(e));
    // If it already exists or backend rejects duplicate create, verify via GET (with fallback) below.
  }

  if (!("authorization" in getAuthHeadersClient())) {
    return;
  }

  const existing = await getWishlistFromApi();
  if (!existing) {
    if (!("authorization" in getAuthHeadersClient())) {
      return;
    }
    const suffix = postError?.message ? ` ${postError.message}` : "";
    throw new Error(`Unable to initialize wishlist for this customer.${suffix}`);
  }
}

function mapWishlistItem(item: WishlistItem): FavouriteProduct | null {
  const variant = item.product_variant;
  const product = variant?.product;
  if (!variant?.id || !product) return null;
  const price = variant.prices?.[0]?.amount ?? 0;
  return {
    id: product.id || product.handle || variant.id,
    slug: product.handle || product.id || variant.id,
    variantId: variant.id,
    wishlistItemId: item.id,
    name: product.title || "Untitled Product",
    description: product.description || "No description available.",
    image: product.thumbnail,
    price,
    category: product.collection?.handle || slugify(product.collection?.title)
  };
}

export async function listWishlistProducts(): Promise<FavouriteProduct[]> {
  if (!("authorization" in getAuthHeadersClient())) {
    return readGuestWishlist();
  }
  await ensureWishlistExists();
  if (!("authorization" in getAuthHeadersClient())) {
    return readGuestWishlist();
  }
  const wishlist = await getWishlistFromApi();
  if (!("authorization" in getAuthHeadersClient())) {
    return readGuestWishlist();
  }
  if (!wishlist?.items?.length) return [];
  return wishlist.items.map(mapWishlistItem).filter((item): item is FavouriteProduct => Boolean(item));
}

export async function isFavourite(variantId?: string): Promise<boolean> {
  if (!variantId) return false;
  const items = await listWishlistProducts();
  return items.some((item) => item.variantId === variantId);
}

export async function addToWishlist(product: Product): Promise<void> {
  if (!product.variantId) {
    throw new Error("Variant not available for wishlist.");
  }
  if (!("authorization" in getAuthHeadersClient())) {
    addGuestWishlistItemIfMissing(product);
    return;
  }

  await ensureWishlistExists();
  if (!("authorization" in getAuthHeadersClient())) {
    addGuestWishlistItemIfMissing(product);
    return;
  }
  const existing = await listWishlistProducts();
  if (existing.some((item) => item.variantId === product.variantId)) {
    return;
  }

  try {
    await sdk.client.fetch("/store/customers/me/wishlists/items", {
      method: "POST",
      headers: getCompleteHeadersClient(),
      body: { variant_id: product.variantId },
      cache: "no-store"
    });
  } catch (e) {
    if (isUnauthorizedError(e)) {
      removeAuthToken();
      addGuestWishlistItemIfMissing(product);
      return;
    }
    throw e;
  }
  emitWishlistChanged();
  emitToast("Item added to wishlist");
}

export async function removeFromWishlist(variantId?: string): Promise<void> {
  if (!variantId) return;
  if (!("authorization" in getAuthHeadersClient())) {
    const next = readGuestWishlist().filter((item) => item.variantId !== variantId);
    writeGuestWishlist(next);
    emitWishlistChanged();
    return;
  }

  const items = await listWishlistProducts();
  if (!("authorization" in getAuthHeadersClient())) {
    const next = readGuestWishlist().filter((item) => item.variantId !== variantId);
    writeGuestWishlist(next);
    emitWishlistChanged();
    return;
  }
  const target = items.find((item) => item.variantId === variantId);
  if (!target?.wishlistItemId) {
    if (!("authorization" in getAuthHeadersClient())) {
      const next = readGuestWishlist().filter((item) => item.variantId !== variantId);
      writeGuestWishlist(next);
      emitWishlistChanged();
    }
    return;
  }

  try {
    await sdk.client.fetch(`/store/customers/me/wishlists/items/${target.wishlistItemId}`, {
      method: "DELETE",
      headers: getCompleteHeadersClient(),
      cache: "no-store"
    });
  } catch (e) {
    if (isUnauthorizedError(e)) {
      removeAuthToken();
      const next = readGuestWishlist().filter((item) => item.variantId !== variantId);
      writeGuestWishlist(next);
      emitWishlistChanged();
      return;
    }
    throw e;
  }
  emitWishlistChanged();
}

