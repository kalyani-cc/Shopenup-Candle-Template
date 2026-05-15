import { sdk } from "@/lib/config";
import { type Product } from "@/lib/store-data";
import { listStoreCollections, type StoreCollectionListItem } from "@/lib/shopenup/collections";
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
  countries?: Array<{ iso_2?: string }>;
};

type StoreProduct = {
  id: string;
  handle?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  images?: Array<{ url?: string }>;
  created_at?: string;
  collection?: StoreCollection | null;
  categories?: StoreCategory[];
  variants?: Array<{
    id?: string;
    variant_id?: string;
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

/** ISO-2 country hint from env (e.g. Medusa `NEXT_PUBLIC_DEFAULT_REGION`). */
function defaultRegionCountryIsoFromEnv(): string | undefined {
  const iso = process.env.NEXT_PUBLIC_DEFAULT_REGION?.trim().toLowerCase();
  return iso || undefined;
}

function pickRegionId(regions: StoreRegion[]): string | undefined {
  if (!regions.length) {
    return undefined;
  }
  const iso = defaultRegionCountryIsoFromEnv();
  if (iso) {
    const match = regions.find((r) =>
      (r.countries || []).some((c) => (c.iso_2 || "").toLowerCase() === iso)
    );
    if (match?.id) {
      return match.id;
    }
  }
  return regions[0]?.id;
}

function firstVariantId(product: StoreProduct): string | undefined {
  const list = product.variants;
  if (!Array.isArray(list) || !list.length) {
    return undefined;
  }
  for (const v of list) {
    const raw = v.id ?? v.variant_id;
    if (raw === undefined || raw === null) {
      continue;
    }
    const s = String(raw).trim();
    if (s) {
      return s;
    }
  }
  return undefined;
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

    const regions = response.regions || [];
    const regionId = pickRegionId(regions);
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
  "*categories,*collection,*variants.calculated_price,*variants.prices,*variants.id,thumbnail,images,title,description,handle,created_at";

const PRODUCT_FIELDS_WITHOUT_CALCULATED_PRICE =
  "*categories,*collection,*variants.prices,*variants.id,thumbnail,images,title,description,handle,created_at";

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
    variantId: firstVariantId(product),
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
    createdAt: product.created_at,
    image,
  };
}

type FetchStoreProductsOptions = {
  limit: number;
  handle?: string;
  /** Medusa list order, e.g. `-created_at` */
  order?: string;
  /** Filter products in this collection (store API `collection_id`). */
  collectionId?: string;
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
        ...(options.order ? { order: options.order } : {}),
        ...(options.collectionId ? { collection_id: options.collectionId } : {}),
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
        ...(options.order ? { order: options.order } : {}),
        ...(options.collectionId ? { collection_id: options.collectionId } : {}),
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

function parseCreatedMs(iso?: string): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

async function fetchAndMapProducts(
  limit: number,
  opts?: { handle?: string; order?: string; collectionId?: string }
): Promise<Product[]> {
  try {
    const raw = await fetchStoreProductsFromApi({
      limit,
      handle: opts?.handle,
      order: opts?.order,
      collectionId: opts?.collectionId,
    });
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

export type HomeHighlightSectionMeta = {
  title: string;
  collectionHandle: string;
};

function pickCollectionByEnv(
  collections: StoreCollectionListItem[],
  envHandle: string | undefined,
  fallbackIndex: number
): StoreCollectionListItem | undefined {
  const raw = envHandle?.trim().toLowerCase();
  if (raw) {
    const found = collections.find((c) => c.handle.toLowerCase() === raw);
    if (found) {
      return found;
    }
  }
  if (!collections.length) {
    return undefined;
  }
  return collections[fallbackIndex] ?? collections[0];
}

function pickSecondCollection(
  collections: StoreCollectionListItem[],
  first: StoreCollectionListItem,
  envHandle: string | undefined,
  fallbackIndex: number
): StoreCollectionListItem {
  const fromEnv = pickCollectionByEnv(collections, envHandle, fallbackIndex);
  if (fromEnv && fromEnv.id !== first.id) {
    return fromEnv;
  }
  const distinct = collections.find((c) => c.id !== first.id);
  if (distinct) {
    return distinct;
  }
  return first;
}

function sliceNewArrivals(products: Product[], eachLimit: number): Product[] {
  const byNew = [...products].sort((a, b) => parseCreatedMs(b.createdAt) - parseCreatedMs(a.createdAt));
  return byNew.slice(0, eachLimit);
}

function sliceBestSelling(products: Product[], newArrivals: Product[], eachLimit: number): Product[] {
  const byBest = [...products].sort((a, b) => {
    const rc = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    if (rc !== 0) return rc;
    const rt = (b.rating ?? 0) - (a.rating ?? 0);
    if (rt !== 0) return rt;
    return parseCreatedMs(a.createdAt) - parseCreatedMs(b.createdAt);
  });
  const newIds = new Set(newArrivals.map((p) => p.id).filter(Boolean));
  const bestPrimary = byBest.filter((p) => !p.id || !newIds.has(p.id));
  return bestPrimary.length >= eachLimit
    ? bestPrimary.slice(0, eachLimit)
    : [...bestPrimary, ...byBest.filter((p) => p.id && newIds.has(p.id))].slice(0, eachLimit);
}

/**
 * Home page: two product strips, each filled from a **store collection** (no “best seller” ranking).
 *
 * Collections:
 * - `NEXT_PUBLIC_HOME_COLLECTION_1_HANDLE` / `NEXT_PUBLIC_HOME_COLLECTION_2_HANDLE` (preferred), or
 * - `NEXT_PUBLIC_HOME_NEW_ARRIVAL_COLLECTION_HANDLE` / `NEXT_PUBLIC_HOME_BEST_SELLING_COLLECTION_HANDLE` (legacy aliases), or
 * - first / second distinct collection from the store list.
 *
 * Products are the first `eachLimit` items from each collection (newest first). If the store has no
 * collections, falls back to global product list with the previous new-arrival / best-seller heuristics.
 */
export async function getHomeProductHighlights(eachLimit = 8): Promise<{
  newArrivals: Product[];
  bestSelling: Product[];
  newArrivalSection?: HomeHighlightSectionMeta;
  bestSellingSection?: HomeHighlightSectionMeta;
}> {
  const collections = await listStoreCollections(24);

  if (!collections.length) {
    const products = await fetchAndMapProducts(100, { order: "-created_at" });
    const newArrivals = sliceNewArrivals(products, eachLimit);
    const bestSelling = sliceBestSelling(products, newArrivals, eachLimit);
    return { newArrivals, bestSelling };
  }

  const env1 =
    process.env.NEXT_PUBLIC_HOME_COLLECTION_1_HANDLE?.trim() ||
    process.env.NEXT_PUBLIC_HOME_NEW_ARRIVAL_COLLECTION_HANDLE?.trim();
  const env2 =
    process.env.NEXT_PUBLIC_HOME_COLLECTION_2_HANDLE?.trim() ||
    process.env.NEXT_PUBLIC_HOME_BEST_SELLING_COLLECTION_HANDLE?.trim();

  const head = collections[0]!;
  const colA = pickCollectionByEnv(collections, env1, 0) ?? head;
  const colB = pickSecondCollection(collections, colA, env2, 1);

  const fetchLimit = Math.max(eachLimit, 24);

  let poolA: Product[];
  let poolB: Product[];
  if (colA.id === colB.id) {
    const shared = await fetchAndMapProducts(fetchLimit, {
      collectionId: colA.id,
      order: "-created_at",
    });
    poolA = shared;
    poolB = shared;
  } else {
    [poolA, poolB] = await Promise.all([
      fetchAndMapProducts(fetchLimit, { collectionId: colA.id, order: "-created_at" }),
      fetchAndMapProducts(fetchLimit, { collectionId: colB.id, order: "-created_at" }),
    ]);
  }

  const newArrivals = poolA.slice(0, eachLimit);
  const bestSelling = poolB.slice(0, eachLimit);

  return {
    newArrivals,
    bestSelling,
    newArrivalSection: { title: colA.title, collectionHandle: colA.handle },
    bestSellingSection: { title: colB.title, collectionHandle: colB.handle },
  };
}

export async function listProducts(limit = 100): Promise<Product[]> {
  return fetchAndMapProducts(limit);
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
