import { sdk } from "@/lib/config";
import { getCompleteHeadersClient } from "@/lib/shopenup/client-cookies";
import type { ProductReviewsResponse, StoreProductReview } from "@/lib/types/product-review";

/** Client-safe headers only — this module is imported by `"use client"` components. */
function reviewHeaders(): Record<string, string> {
  return getCompleteHeadersClient();
}

/** POST/PUT responses from the reviews plugin may omit fields or use nested / camelCase shapes. */
export function normalizeStoreProductReview(raw: unknown): StoreProductReview | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const nested =
    o.review && typeof o.review === "object"
      ? (o.review as Record<string, unknown>)
      : o.product_review && typeof o.product_review === "object"
        ? (o.product_review as Record<string, unknown>)
        : o.data && typeof o.data === "object"
          ? (o.data as Record<string, unknown>)
          : o;

  const id = String(nested.id ?? nested.review_id ?? "").trim();
  if (!id) {
    return null;
  }

  const ratingRaw = nested.rating ?? nested.stars ?? nested.score;
  const rating = Number(ratingRaw);
  const content = String(nested.content ?? nested.body ?? nested.description ?? "").trim();

  return {
    id,
    rating: Number.isFinite(rating) ? rating : 0,
    content,
    title:
      nested.title != null && String(nested.title).trim()
        ? String(nested.title).trim()
        : undefined,
    first_name: String(nested.first_name ?? nested.firstName ?? "Customer").trim() || "Customer",
    last_name: String(nested.last_name ?? nested.lastName ?? "User").trim() || "User",
    product_id: String(nested.product_id ?? nested.productId ?? "").trim(),
    customer_id:
      nested.customer_id != null
        ? String(nested.customer_id)
        : nested.customerId != null
          ? String(nested.customerId)
          : null,
    status: nested.status != null ? String(nested.status) : undefined,
    created_at:
      nested.created_at != null
        ? String(nested.created_at)
        : nested.createdAt != null
          ? String(nested.createdAt)
          : undefined,
  };
}

function normalizeReviewsResponse(
  response: ProductReviewsResponse & Record<string, unknown>
): ProductReviewsResponse {
  const rawList = Array.isArray(response.reviews)
    ? response.reviews
    : Array.isArray(response.data)
      ? response.data
      : [];
  const reviews = rawList
    .map((row) => normalizeStoreProductReview(row))
    .filter((r): r is StoreProductReview => Boolean(r));

  return {
    reviews,
    average_rating: Number(response.average_rating) || 0,
    limit: response.limit ?? 10,
    offset: response.offset ?? 0,
    count: Number(response.count) || reviews.length,
  };
}

export async function getProductReviewsById(params: {
  productId: string;
  limit?: number;
  offset?: number;
}): Promise<ProductReviewsResponse> {
  const { productId, limit = 10, offset = 0 } = params;
  if (!productId) {
    return { reviews: [], average_rating: 0, limit, offset, count: 0 };
  }

  try {
    const response = await sdk.client.fetch<ProductReviewsResponse>(
      `/store/products/${productId}/reviews`,
      {
        headers: reviewHeaders(),
        query: { limit, offset, order: "-created_at" },
        cache: "no-store",
      }
    );
    return normalizeReviewsResponse({
      ...(response as ProductReviewsResponse & Record<string, unknown>),
      limit: response.limit ?? limit,
      offset: response.offset ?? offset,
    });
  } catch {
    return { reviews: [], average_rating: 0, limit, offset, count: 0 };
  }
}

export async function getProductRatingsBulk(
  productIds: string[]
): Promise<Record<string, { rating: number; reviewCount: number }>> {
  const unique = [...new Set(productIds.map((id) => id?.trim()).filter(Boolean))];
  if (!unique.length) {
    return {};
  }

  const map: Record<string, { rating: number; reviewCount: number }> = {};
  const chunkSize = 35;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const slice = unique.slice(i, i + chunkSize);
    try {
      const response = await sdk.client.fetch<{
        ratings?: Array<{
          product_id: string;
          average_rating?: number;
          total_reviews?: number;
        }>;
      }>("/store/reviews", {
        query: { product_ids: slice.join(",") },
        cache: "no-store",
        headers: reviewHeaders(),
      });

      (response.ratings || []).forEach((row) => {
        if (!row?.product_id) return;
        map[row.product_id] = {
          rating: Number(row.average_rating) || 0,
          reviewCount: Number(row.total_reviews) || 0,
        };
      });
    } catch {
      /* ignore chunk */
    }
  }

  return map;
}

export async function addProductReview(input: {
  title?: string;
  content: string;
  first_name: string;
  last_name: string;
  rating: number;
  product_id: string;
}): Promise<StoreProductReview | null> {
  try {
    const response = await sdk.client.fetch<unknown>("/store/reviews", {
      method: "POST",
      headers: reviewHeaders(),
      body: input,
      cache: "no-store",
    });
    return normalizeStoreProductReview(response);
  } catch {
    return null;
  }
}

export async function updateProductReview(input: {
  id: string;
  title?: string;
  content?: string;
  first_name?: string;
  last_name?: string;
  rating?: number;
}): Promise<StoreProductReview | null> {
  try {
    const response = await sdk.client.fetch<unknown>("/store/reviews", {
      method: "PUT",
      headers: reviewHeaders(),
      body: input,
      cache: "no-store",
    });
    return normalizeStoreProductReview(response);
  } catch {
    return null;
  }
}
