import { sdk } from "@/lib/config";
import { type Product } from "@/lib/store-data";
import { getCompleteHeaders } from "@/lib/shopenup/cookies";

type StoreCollection = {
  id: string;
  handle?: string;
  title?: string;
};

type StoreCategory = {
  id: string;
  handle?: string;
  name?: string;
  title?: string;
};

type StoreRegion = {
  id: string;
};

type StoreProduct = {
  id: string;
  handle?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  images?: Array<{ url?: string }>;
  collection?: StoreCollection | null;
  categories?: StoreCategory[];
  variants?: Array<{
    id?: string;
    calculated_price?:
      | number
      | {
          calculated_amount?: number;
          original_amount?: number;
        };
    price?: number;
    prices?: Array<{
      amount?: number;
    }>;
  }>;
};

type ProductRating = {
  product_id?: string;
  productId?: string;
  average_rating?: number;
  averageRating?: number;
  total_reviews?: number;
  totalReviews?: number;
};

function normalizeRatingRow(row: ProductRating): { productId: string; rating: number; reviewCount: number } | null {
  const pid = row.product_id || row.productId;
  if (!pid) {
    return null;
  }
  const rating = Number(row.average_rating ?? row.averageRating ?? 0) || 0;
  const reviewCount = Number(row.total_reviews ?? row.totalReviews ?? 0) || 0;
  return { productId: pid, rating, reviewCount };
}

function extractRatingsPayload(body: unknown): ProductRating[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const o = body as Record<string, unknown>;
  const candidates = [o.ratings, o.data, o.product_ratings, o.reviews];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c as ProductRating[];
    }
    if (c && typeof c === "object" && Array.isArray((c as { ratings?: unknown }).ratings)) {
      return (c as { ratings: ProductRating[] }).ratings;
    }
  }
  return [];
}

let cachedRegionId: string | null = null;

function regionIdFromEnv(): string | undefined {
  const id = process.env.NEXT_PUBLIC_SHOPENUP_DEFAULT_REGION_ID?.trim();
  return id || undefined;
}

async function getDefaultRegionId(): Promise<string | undefined> {
  const fromEnv = regionIdFromEnv();
  if (fromEnv) {
    cachedRegionId = fromEnv;
    return fromEnv;
  }

  if (cachedRegionId) {
    return cachedRegionId;
  }

  try {
    const response = await sdk.client.fetch<{ regions?: StoreRegion[] }>("/store/regions", {
      query: { limit: 50 },
      next: { tags: ["regions"], revalidate: 300 },
      headers: await getCompleteHeaders(),
    });

    const regionId = response.regions?.[0]?.id;
    if (regionId) {
      cachedRegionId = regionId;
      return regionId;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

const PRODUCT_FIELDS_WITH_CALCULATED_PRICE =
  "*categories,*collection,*variants.calculated_price,*variants.prices,*variants.id,thumbnail,images,title,description,handle";

const PRODUCT_FIELDS_WITHOUT_CALCULATED_PRICE =
  "*categories,*collection,*variants.prices,*variants.id,thumbnail,images,title,description,handle";

function mapPrice(product: StoreProduct): { price: number; oldPrice?: number } {
  const variant = product.variants?.[0];
  let calculated: number | undefined;
  let original: number | undefined;
  const cp = variant?.calculated_price;
  if (typeof cp === "number") {
    calculated = cp;
  } else if (cp && typeof cp === "object") {
    calculated = cp.calculated_amount;
    original = cp.original_amount;
  }
  const variantPrice =
    typeof variant?.price === "number" ? variant.price : variant?.prices?.[0]?.amount;
  const amount = calculated ?? variantPrice ?? 0;
  const oldAmount = original && original > amount ? original : undefined;

  return {
    price: amount,
    oldPrice: oldAmount,
  };
}

function slugify(value?: string): string {
  if (!value) {
    return "uncategorized";
  }
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function mapProduct(product: StoreProduct): Product {
  const mappedPrice = mapPrice(product);
  const image = product.thumbnail || product.images?.[0]?.url;
  const primaryCategory = product.categories?.[0];
  const categoryLabel =
    primaryCategory?.name || primaryCategory?.title || product.collection?.title || "Uncategorized";
  const categorySlug =
    primaryCategory?.handle ||
    slugify(primaryCategory?.name || primaryCategory?.title) ||
    product.collection?.handle ||
    slugify(product.collection?.title);

  const collectionHandle =
    product.collection?.handle || slugify(product.collection?.title) || "";
  const collectionLabel =
    product.collection?.title || product.collection?.handle || "Uncategorized";

  return {
    id: product.id,
    slug: product.handle || product.id,
    variantId: product.variants?.[0]?.id,
    name: product.title || "Untitled Product",
    category: categorySlug,
    categoryLabel,
    collection: collectionHandle || collectionLabel,
    collectionLabel,
    description: product.description || "No description available.",
    price: mappedPrice.price,
    oldPrice: mappedPrice.oldPrice,
    rating: 0,
    reviewCount: 0,
    image,
  };
}

type FetchStoreProductsOptions = {
  limit: number;
  handle?: string;
};

async function fetchStoreProductsFromApi(options: FetchStoreProductsOptions): Promise<StoreProduct[]> {
  const headers = await getCompleteHeaders();
  const next = { tags: ["products"], revalidate: 60 };
  const limit = options.handle ? 1 : options.limit;

  const withCalculatedPrice = async (regionId: string) =>
    sdk.client.fetch<{ products?: StoreProduct[] }>("/store/products", {
      query: {
        limit,
        ...(options.handle ? { handle: options.handle } : {}),
        region_id: regionId,
        fields: PRODUCT_FIELDS_WITH_CALCULATED_PRICE,
      },
      next,
      headers,
    });

  const withoutCalculatedPrice = () =>
    sdk.client.fetch<{ products?: StoreProduct[] }>("/store/products", {
      query: {
        limit,
        ...(options.handle ? { handle: options.handle } : {}),
        fields: PRODUCT_FIELDS_WITHOUT_CALCULATED_PRICE,
      },
      next,
      headers,
    });

  const regionId = await getDefaultRegionId();

  if (regionId) {
    try {
      const res = await withCalculatedPrice(regionId);
      const list = res.products || [];
      if (list.length || options.handle) {
        return list;
      }
    } catch {
      if (!regionIdFromEnv()) {
        cachedRegionId = null;
      }
    }
  }

  try {
    const res = await withoutCalculatedPrice();
    return res.products || [];
  } catch {
    return [];
  }
}

async function fetchStoreProductByIdFromApi(productId: string): Promise<StoreProduct | null> {
  const headers = await getCompleteHeaders();
  const next = { tags: ["products"], revalidate: 60 };
  const path = `/store/products/${encodeURIComponent(productId)}`;

  const withCalculatedPrice = async (regionId: string) =>
    sdk.client.fetch<{ product?: StoreProduct }>(path, {
      query: {
        region_id: regionId,
        fields: PRODUCT_FIELDS_WITH_CALCULATED_PRICE,
      },
      next,
      headers,
    });

  const withoutCalculatedPrice = () =>
    sdk.client.fetch<{ product?: StoreProduct }>(path, {
      query: {
        fields: PRODUCT_FIELDS_WITHOUT_CALCULATED_PRICE,
      },
      next,
      headers,
    });

  const regionId = await getDefaultRegionId();

  if (regionId) {
    try {
      const res = await withCalculatedPrice(regionId);
      if (res.product) {
        return res.product;
      }
    } catch {
      if (!regionIdFromEnv()) {
        cachedRegionId = null;
      }
    }
  }

  try {
    const res = await withoutCalculatedPrice();
    return res.product ?? null;
  } catch {
    return null;
  }
}

const RATINGS_ID_CHUNK = 35;

async function fetchRatingsForProductIds(
  productIds: string[]
): Promise<Record<string, { rating: number; reviewCount: number }>> {
  const unique = [...new Set(productIds.map((id) => id?.trim()).filter((id): id is string => Boolean(id)))];
  if (!unique.length) {
    return {};
  }

  const map: Record<string, { rating: number; reviewCount: number }> = {};

  for (let i = 0; i < unique.length; i += RATINGS_ID_CHUNK) {
    const slice = unique.slice(i, i + RATINGS_ID_CHUNK);
    try {
      const response = await sdk.client.fetch<unknown>("/store/reviews", {
        query: { product_ids: slice.join(",") },
        cache: "no-store",
        headers: await getCompleteHeaders(),
      });

      extractRatingsPayload(response).forEach((row) => {
        const n = normalizeRatingRow(row);
        if (!n) {
          return;
        }
        map[n.productId] = {
          rating: n.rating,
          reviewCount: n.reviewCount,
        };
      });
    } catch {
      /* ignore chunk */
    }
  }

  return map;
}

/**
 * Distinct category handles/labels from store products (no ratings call).
 * Used when `/store/product-categories` is empty or unavailable.
 */
export async function listDistinctCategoriesFromProducts(limit = 16): Promise<
  Array<{ id: string; handle: string; label: string }>
> {
  try {
    const raw = await fetchStoreProductsFromApi({ limit: 100 });
    const products = raw.map(mapProduct);
    const seen = new Map<string, { id: string; handle: string; label: string }>();
    for (const p of products) {
      const handle = (p.category || "").trim();
      if (!handle || handle.toLowerCase() === "uncategorized") {
        continue;
      }
      const key = handle.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      const label = (p.categoryLabel || handle).trim() || handle;
      seen.set(key, {
        id: key,
        handle,
        label,
      });
      if (seen.size >= limit) {
        break;
      }
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  } catch {
    return [];
  }
}

export async function listProducts(limit = 100): Promise<Product[]> {
  try {
    const raw = await fetchStoreProductsFromApi({ limit });
    const products = raw.map(mapProduct);
    const ratingsMap = await fetchRatingsForProductIds(
      products.map((p) => p.id).filter((id): id is string => Boolean(id))
    );
    return products.map((p) => {
      const id = p.id;
      if (!id || !(id in ratingsMap)) {
        return p;
      }
      return {
        ...p,
        rating: ratingsMap[id].rating,
        reviewCount: ratingsMap[id].reviewCount,
      };
    });
  } catch {
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const trimmed = id?.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const raw = await fetchStoreProductByIdFromApi(trimmed);
    if (!raw) {
      return null;
    }
    const mapped = mapProduct(raw);
    const ratingsMap = await fetchRatingsForProductIds(raw.id ? [raw.id] : []);
    if (mapped.id && mapped.id in ratingsMap) {
      mapped.rating = ratingsMap[mapped.id].rating;
      mapped.reviewCount = ratingsMap[mapped.id].reviewCount;
    }
    return mapped;
  } catch {
    return null;
  }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  try {
    const raw = await fetchStoreProductsFromApi({ limit: 1, handle });
    const product = raw[0];
    if (!product) {
      return null;
    }
    const mapped = mapProduct(product);
    const ratingsMap = await fetchRatingsForProductIds(product.id ? [product.id] : []);
    if (mapped.id && mapped.id in ratingsMap) {
      mapped.rating = ratingsMap[mapped.id].rating;
      mapped.reviewCount = ratingsMap[mapped.id].reviewCount;
    }
    return mapped;
  } catch {
    return null;
  }
}

export async function listProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await listProducts(100);
  return products.filter((item) => item.category === categorySlug);
}

/** Same category as `categorySlug`, excluding the current product (by id or slug). */
export async function listRelatedProducts(
  currentProductId: string | undefined,
  currentSlug: string | undefined,
  categorySlug: string,
  limit = 8
): Promise<Product[]> {
  const sameCategory = await listProductsByCategory(categorySlug);
  const slugKey = (currentSlug || "").trim();
  const idKey = (currentProductId || "").trim();

  return sameCategory
    .filter((p) => {
      if (idKey && p.id && p.id === idKey) return false;
      const pSlug = (p.slug || "").trim();
      if (slugKey && pSlug === slugKey) return false;
      if (idKey && pSlug === idKey) return false;
      return true;
    })
    .slice(0, Math.max(0, limit));
}
