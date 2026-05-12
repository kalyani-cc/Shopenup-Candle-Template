"use client";

import { sdk } from "@/lib/config";
import {
  getCartId,
  getCompleteHeadersClient,
  removeCartId,
  setCartId
} from "@/lib/shopenup/client-cookies";

export type StoreCartItem = {
  id: string;
  title?: string;
  quantity: number;
  unit_price?: number;
  subtotal?: number;
  total?: number;
  product_title?: string;
  variant_title?: string;
  thumbnail?: string;
  variant?: {
    product?: {
      thumbnail?: string | null;
    } | null;
  } | null;
};

export type StoreCart = {
  id: string;
  items: StoreCartItem[];
  subtotal?: number;
  discount_subtotal?: number;
  discount_tax_total?: number;
  discount_total?: number;
  tax_total?: number;
  shipping_total?: number;
  original_item_subtotal?: number;
  original_shipping_subtotal?: number;
  total?: number;
  currency_code?: string;
  region_id?: string;
  completed_at?: string | null;
  promotions?: Array<{
    code?: string;
    application_method?: {
      type?: string;
      value?: number;
    };
  }>;
  payment_collections?: Array<{ id: string }>;
};

type Region = { id: string };
type RawStoreCart = StoreCart & {
  items?: Array<StoreCartItem & { quantity?: number }>;
};

function emitCartChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lumin_next:cart_changed"));
  }
}

function emitToast(message: string, type: "success" | "info" | "error" = "success") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lumin_next:toast", { detail: { message, type } }));
  }
}

/** Ask API for line thumbnails (and variant product image fallback). */
const CART_RETRIEVE_FIELDS =
  "id,subtotal,tax_total,shipping_total,discount_subtotal,discount_tax_total,discount_total,total,currency_code,region_id,completed_at,promotions,payment_collections," +
  "*items,*items.thumbnail,*items.title,*items.product_title,*items.unit_price,*items.subtotal,*items.total,*items.quantity," +
  "*items.variant,*items.variant.product.thumbnail";

export function notifyCartChanged() {
  emitCartChanged();
}

export function getCartLineThumbnail(item: StoreCartItem): string | undefined {
  const direct = typeof item.thumbnail === "string" ? item.thumbnail.trim() : "";
  if (direct) {
    return direct;
  }
  const fromProduct = item.variant?.product?.thumbnail;
  const p = typeof fromProduct === "string" ? fromProduct.trim() : "";
  return p || undefined;
}

function normalizeCart(cart: StoreCart): StoreCart {
  const items = Array.isArray(cart.items) ? cart.items.filter((item) => (item.quantity || 0) > 0) : [];
  return {
    ...cart,
    items
  };
}

async function getDefaultRegionId(): Promise<string> {
  const envRegionId = process.env.NEXT_PUBLIC_SHOPENUP_DEFAULT_REGION_ID?.trim();
  if (envRegionId) {
    return envRegionId;
  }

  const response = await sdk.client.fetch<{ regions: Region[] }>("/store/regions", {
    query: { limit: 1 },
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });

  const regionId = response.regions?.[0]?.id;
  if (!regionId) {
    throw new Error("No region found for cart creation.");
  }
  return regionId;
}

async function createCart(): Promise<StoreCart> {
  const regionId = await getDefaultRegionId();
  const response = await sdk.client.fetch<{ cart: StoreCart }>("/store/carts", {
    method: "POST",
    body: { region_id: regionId },
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  setCartId(response.cart.id);
  emitCartChanged();
  return normalizeCart(response.cart);
}

export async function retrieveCart(): Promise<StoreCart | null> {
  const cartId = getCartId();
  if (!cartId) {
    return null;
  }

  try {
    // Some backends crash when using deep `fields=` projections (MikroORM joined filters "strategy" bug).
    // Fetch the cart without projections for maximum compatibility.
    const response = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cartId}`, {
      cache: "no-store",
      headers: getCompleteHeadersClient()
    });
    if (response.cart?.completed_at) {
      removeCartId();
      emitCartChanged();
      return null;
    }
    return normalizeCart(response.cart);
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (/not found|invalid/i.test(message)) {
      removeCartId();
      emitCartChanged();
      return null;
    }
    throw e;
  }
}

async function getOrCreateCart(): Promise<StoreCart> {
  const existing = await retrieveCart();
  if (existing) {
    return existing;
  }
  return createCart();
}

export async function addToCart(variantId: string, quantity = 1): Promise<StoreCart> {
  if (!variantId) {
    throw new Error("Variant not available for this product.");
  }
  const cart = await getOrCreateCart();
  const response = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cart.id}/line-items`, {
    method: "POST",
    body: {
      variant_id: variantId,
      quantity
    },
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  emitCartChanged();
  emitToast("Item added to cart");
  return normalizeCart(response.cart);
}

export async function updateCartItem(lineId: string, quantity: number): Promise<StoreCart> {
  const cart = await getOrCreateCart();
  const response = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cart.id}/line-items/${lineId}`, {
    method: "POST",
    body: { quantity },
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  emitCartChanged();
  return normalizeCart(response.cart);
}

export async function removeCartItem(lineId: string): Promise<StoreCart> {
  const cart = await getOrCreateCart();
  try {
    const updated = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cart.id}/line-items/${lineId}`, {
      method: "POST",
      body: { quantity: 0 },
      cache: "no-store",
      headers: getCompleteHeadersClient()
    });
    emitCartChanged();
    return normalizeCart(updated.cart);
  } catch {
    const response = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cart.id}/line-items/${lineId}`, {
      method: "DELETE",
      cache: "no-store",
      headers: getCompleteHeadersClient()
    });
    emitCartChanged();
    return normalizeCart(response.cart);
  }
}

type UpdateCartBody = {
  email?: string;
  shipping_address?: Record<string, unknown>;
  billing_address?: Record<string, unknown>;
  promo_codes?: string[];
};

export async function updateCart(body: UpdateCartBody): Promise<StoreCart> {
  const cart = await getOrCreateCart();
  const safeBody: UpdateCartBody = {
    ...body,
    promo_codes: body.promo_codes?.filter(Boolean).slice(0, 1)
  };
  const response = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cart.id}`, {
    method: "POST",
    body: safeBody,
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  emitCartChanged();
  return normalizeCart(response.cart);
}

export async function listShippingOptions(): Promise<
  Array<{ id: string; name?: string; amount?: number; price_type?: string; provider_id?: string }>
> {
  const cart = await getOrCreateCart();
  const response = await sdk.client.fetch<{
    shipping_options?: Array<{ id: string; name?: string; amount?: number; price_type?: string; provider_id?: string }>;
  }>("/store/shipping-options", 
    {
      query: { cart_id: cart.id },
      cache: "no-store",
      headers: getCompleteHeadersClient()
    }
  );
  return response.shipping_options || [];
}

export async function addShippingMethod(
  optionId: string,
  data?: Record<string, unknown>
): Promise<StoreCart> {
  const cart = await getOrCreateCart();
  const response = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cart.id}/shipping-methods`, {
    method: "POST",
    body: data ? { option_id: optionId, data } : { option_id: optionId },
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  emitCartChanged();
  return normalizeCart(response.cart);
}

export async function listPaymentProviders(regionId?: string): Promise<Array<{ id: string }>> {
  if (!regionId) {
    return [];
  }
  const response = await sdk.client.fetch<{ payment_providers?: Array<{ id: string }> }>("/store/payment-providers", {
    query: { region_id: regionId },
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  return response.payment_providers || [];
}

async function getOrCreatePaymentCollectionId(cartId: string): Promise<string> {
  try {
    const created = await sdk.client.fetch<{ payment_collection?: { id: string } }>("/store/payment-collections", {
      method: "POST",
      body: { cart_id: cartId },
      cache: "no-store",
      headers: getCompleteHeadersClient()
    });
    if (created.payment_collection?.id) {
      return created.payment_collection.id;
    }
  } catch {
    // continue with fallback read
  }

  const cartResponse = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cartId}`, {
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  const existingId = cartResponse.cart.payment_collections?.[0]?.id;
  if (!existingId) {
    throw new Error("Unable to initialize payment collection for this cart.");
  }
  return existingId;
}

async function cleanupZeroQuantityItems(cartId: string): Promise<void> {
  const current = await sdk.client.fetch<{ cart: RawStoreCart }>(`/store/carts/${cartId}`, {
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  const zeroQtyItems = (current.cart.items || []).filter((item) => (item.quantity || 0) <= 0);
  if (!zeroQtyItems.length) {
    return;
  }
  for (const item of zeroQtyItems) {
    if (!item.id) {
      continue;
    }
    try {
      await sdk.client.fetch(`/store/carts/${cartId}/line-items/${item.id}`, {
        method: "DELETE",
        cache: "no-store",
        headers: getCompleteHeadersClient()
      });
    } catch {
      // continue cleanup for remaining invalid lines
    }
  }
}

export async function setPaymentSession(providerId: string): Promise<StoreCart> {
  const cart = await getOrCreateCart();
  const paymentCollectionId = await getOrCreatePaymentCollectionId(cart.id);

  await sdk.client.fetch<{ payment_collection: { id: string } }>(
    `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
    {
      method: "POST",
      body: { provider_id: providerId },
      cache: "no-store",
      headers: getCompleteHeadersClient()
    }
  );

  const response = await sdk.client.fetch<{ cart: StoreCart }>(`/store/carts/${cart.id}`, {
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  emitCartChanged();
  return normalizeCart(response.cart);
}

export async function completeCart(): Promise<{ type?: string; order?: { id?: string } }> {
  const cart = await getOrCreateCart();
  await cleanupZeroQuantityItems(cart.id);

  const response = await sdk.client.fetch<{ type?: string; order?: { id?: string } }>(`/store/carts/${cart.id}/complete`, {
    method: "POST",
    cache: "no-store",
    headers: getCompleteHeadersClient()
  });
  emitCartChanged();
  removeCartId();
  emitToast("Order placed successfully");
  return response;
}

