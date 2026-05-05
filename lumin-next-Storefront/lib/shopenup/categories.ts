import { cache } from "react";
import { sdk } from "@/lib/config";
import { listDistinctCategoriesFromProducts } from "@/lib/shopenup/product";
import { getCompleteHeaders } from "@/lib/shopenup/cookies";

export type FooterCategory = {
  id: string;
  handle: string;
  label: string;
};

type ApiCategory = {
  id: string;
  handle?: string | null;
  name?: string | null;
  title?: string | null;
  parent_category_id?: string | null;
  rank?: number | null;
};

function normalizeCategoriesPayload(body: unknown): ApiCategory[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const o = body as Record<string, unknown>;
  const candidates = [o.product_categories, o.categories, o.productCategories];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) {
      return c as ApiCategory[];
    }
  }

  const data = o.data;
  if (Array.isArray(data)) {
    const out: ApiCategory[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const row = item as Record<string, unknown>;
      const attrs =
        row.attributes && typeof row.attributes === "object"
          ? (row.attributes as Record<string, unknown>)
          : {};
      const id = String(row.id ?? attrs.id ?? "").trim();
      if (!id) {
        continue;
      }
      const handle = (attrs.handle ?? row.handle) as string | null | undefined;
      const name = (attrs.name ?? attrs.title ?? row.name ?? row.title) as string | null | undefined;
      const parent = (attrs.parent_category_id ?? attrs.parent_id) as string | null | undefined;
      const rank = attrs.rank as number | null | undefined;
      out.push({
        id,
        handle: handle ?? null,
        name: name ?? null,
        title: (attrs.title as string | undefined) ?? null,
        parent_category_id: parent ?? null,
        rank: rank ?? null,
      });
    }
    return out;
  }

  return [];
}

function mapApiCategoriesToFooter(raw: ApiCategory[], limit: number): FooterCategory[] {
  const topLevel = raw.filter((c) => !c.parent_category_id);
  const pool = topLevel.length ? topLevel : raw;

  const sorted = [...pool].sort((a, b) => {
    const ra = a.rank ?? 0;
    const rb = b.rank ?? 0;
    if (ra !== rb) {
      return ra - rb;
    }
    const la = (a.name || a.title || a.handle || "").toLowerCase();
    const lb = (b.name || b.title || b.handle || "").toLowerCase();
    return la.localeCompare(lb);
  });

  return sorted.slice(0, limit).map((c) => {
    const handle = (c.handle || c.id).trim();
    const label = (c.name || c.title || handle || "Category").trim();
    return { id: c.id, handle, label };
  });
}

async function fetchCategoriesFromStoreApi(limit: number): Promise<FooterCategory[]> {
  const headers = await getCompleteHeaders();
  const cap = Math.min(50, Math.max(limit, 1) * 2);
  const next = { revalidate: 300, tags: ["product-categories"] as string[] };

  const attempts: Array<{ fields?: string } | Record<string, never>> = [
    { fields: "id,handle,name,parent_category_id,rank" },
    { fields: "id,handle,name,title,parent_category_id,rank" },
    {},
  ];

  for (const extra of attempts) {
    try {
      const res = await sdk.client.fetch<unknown>("/store/product-categories", {
        query: {
          limit: cap,
          offset: 0,
          ...extra,
        },
        next,
        headers,
      });

      const raw = normalizeCategoriesPayload(res);
      const mapped = mapApiCategoriesToFooter(raw, limit);
      if (mapped.length) {
        return mapped;
      }
    } catch {
      /* try next variant */
    }
  }

  return [];
}

async function listFooterProductCategoriesImpl(limit = 16): Promise<FooterCategory[]> {
  const fromApi = await fetchCategoriesFromStoreApi(limit);
  if (fromApi.length) {
    return fromApi;
  }

  return listDistinctCategoriesFromProducts(limit);
}

/**
 * Load product categories for footer / nav. Prefers top-level categories (no parent).
 * Falls back to distinct categories inferred from products when the categories API is empty.
 * Cached per request so template footer + React footer share one fetch.
 */
export const listFooterProductCategories = cache(listFooterProductCategoriesImpl);
