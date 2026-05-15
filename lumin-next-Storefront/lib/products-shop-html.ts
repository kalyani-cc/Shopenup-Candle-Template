import type { Product } from "@/lib/store-data";
import { formatCurrency } from "@/lib/utils";

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

export type ShopSortKey =
  | "relevance"
  | "alpha_asc"
  | "alpha_desc"
  | "price_asc"
  | "price_desc"
  | "rated"
  | "newest"
  | "popular";

export type ProductsFilterState = {
  q?: string;
  category?: string;
  categories?: string;
  collection?: string;
  sort?: ShopSortKey;
  min?: string;
  max?: string;
  rating?: string;
  view?: "grid" | "list";
};

/** Apply URL patch: empty string removes that filter key. */
export function applyFilterPatch(
  base: ProductsFilterState,
  patch: Partial<Record<keyof ProductsFilterState, string | undefined>>
): ProductsFilterState {
  const out: ProductsFilterState = { ...base };
  (Object.keys(patch) as (keyof ProductsFilterState)[]).forEach((k) => {
    const v = patch[k];
    if (v === undefined) return;
    if (v === "") {
      delete out[k];
    } else {
      (out as Record<string, string>)[k] = v;
    }
  });
  return out;
}

export function buildProductsUrl(state: ProductsFilterState): string {
  const qs = new URLSearchParams();
  if (state.q?.trim()) qs.set("q", state.q.trim());
  if (state.categories?.trim()) qs.set("categories", state.categories.trim());
  else if (state.category?.trim()) qs.set("category", state.category.trim());
  if (state.collection?.trim()) qs.set("collection", state.collection.trim());
  if (state.sort && state.sort !== "relevance") qs.set("sort", state.sort);
  if (state.min?.trim()) qs.set("min", state.min.trim());
  if (state.max?.trim()) qs.set("max", state.max.trim());
  if (state.rating?.trim()) qs.set("rating", state.rating.trim());
  if (state.view && state.view !== "grid") qs.set("view", state.view);
  const s = qs.toString();
  return s ? `/products?${s}` : "/products";
}

export function parseProductsFilterState(
  sp: Record<string, string | string[] | undefined>
): ProductsFilterState {
  const one = (key: string): string | undefined => {
    const v = sp[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const rawSort = (one("sort") || "").trim().toLowerCase();
  const sortKeys: ShopSortKey[] = [
    "relevance",
    "alpha_asc",
    "alpha_desc",
    "price_asc",
    "price_desc",
    "rated",
    "newest",
    "popular",
  ];
  const sort = sortKeys.includes(rawSort as ShopSortKey) ? (rawSort as ShopSortKey) : "relevance";

  const catsRaw = sp["categories"];
  let categories: string | undefined;
  if (Array.isArray(catsRaw)) {
    categories = catsRaw.map((c) => String(c).trim()).filter(Boolean).join(",");
  } else if (typeof catsRaw === "string" && catsRaw.trim()) {
    categories = catsRaw.trim();
  }

  const viewRaw = (one("view") || "").trim().toLowerCase();
  const view = viewRaw === "list" ? "list" : "grid";

  return {
    q: one("q")?.trim(),
    category: one("category")?.trim(),
    categories,
    collection: one("collection")?.trim(),
    sort,
    min: one("min")?.trim(),
    max: one("max")?.trim(),
    rating: one("rating")?.trim(),
    view,
  };
}

function starPct(rating: number | undefined): number {
  const r = Number(rating);
  if (!Number.isFinite(r) || r <= 0) return 0;
  return Math.min(100, Math.round((r / 5) * 100));
}

type FacetCategory = { handle: string; label: string; count: number };

function buildFacets(products: Product[]): {
  categories: FacetCategory[];
  collections: FacetCategory[];
  priceMin: number;
  priceMax: number;
} {
  const catMap = new Map<string, { label: string; count: number }>();
  const colMap = new Map<string, { label: string; count: number }>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const p of products) {
    const pr = Number(p.price) || 0;
    if (pr < priceMin) priceMin = pr;
    if (pr > priceMax) priceMax = pr;

    const ch = (p.category || "").trim().toLowerCase();
    if (ch && ch !== "uncategorized") {
      const label = (p.categoryLabel || ch).trim() || ch;
      const cur = catMap.get(ch) || { label, count: 0 };
      cur.count += 1;
      catMap.set(ch, cur);
    }

    const colH = (p.collection || "").trim().toLowerCase();
    if (colH && colH !== "uncategorized") {
      const label = (p.collectionLabel || colH).trim() || colH;
      const cur = colMap.get(colH) || { label, count: 0 };
      cur.count += 1;
      colMap.set(colH, cur);
    }
  }

  if (!Number.isFinite(priceMin)) priceMin = 0;
  if (priceMax < priceMin) priceMax = priceMin;

  const categories = [...catMap.entries()]
    .map(([handle, v]) => ({ handle, label: v.label, count: v.count }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  const collections = [...colMap.entries()]
    .map(([handle, v]) => ({ handle, label: v.label, count: v.count }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  return { categories, collections, priceMin, priceMax };
}

function parseSelectedCategories(state: ProductsFilterState): Set<string> {
  const set = new Set<string>();
  if (state.categories?.trim()) {
    state.categories.split(",").forEach((s) => {
      const t = s.trim().toLowerCase();
      if (t) set.add(t);
    });
  }
  if (state.category?.trim()) {
    set.add(state.category.trim().toLowerCase());
  }
  return set;
}

/** SSR-safe facet toggle (avoids duplicate GET keys for checkboxes). */
function toggleCategoryHref(state: ProductsFilterState, handle: string): string {
  const set = parseSelectedCategories(state);
  const h = handle.trim().toLowerCase();
  if (set.has(h)) set.delete(h);
  else set.add(h);
  const csv = [...set].join(",");
  return buildProductsUrl(applyFilterPatch(state, { categories: csv || "", category: "" }));
}

export function getSortLabel(sort: ShopSortKey): string {
  switch (sort) {
    case "alpha_asc":
      return "Sort by Name: A to Z";
    case "alpha_desc":
      return "Sort by Name: Z to A";
    case "price_asc":
      return "Sort by Price: Low to High";
    case "price_desc":
      return "Sort by Price: High to Low";
    default:
      return "Sort by Relevance";
  }
}

/** Hidden inputs for GET forms — omit keys that have their own control on that form. */
export function buildShopFilterHiddenInputsHtml(
  state: ProductsFilterState,
  omit: (keyof ProductsFilterState)[]
): string {
  const skip = new Set(omit);
  const parts: string[] = [];
  if (!skip.has("q") && state.q?.trim()) parts.push(`<input type="hidden" name="q" value="${escapeAttr(state.q.trim())}" />`);
  if (!skip.has("categories") && state.categories?.trim()) {
    parts.push(`<input type="hidden" name="categories" value="${escapeAttr(state.categories.trim())}" />`);
  } else if (!skip.has("category") && state.category?.trim()) {
    parts.push(`<input type="hidden" name="category" value="${escapeAttr(state.category.trim())}" />`);
  }
  if (!skip.has("collection") && state.collection?.trim()) {
    parts.push(`<input type="hidden" name="collection" value="${escapeAttr(state.collection.trim())}" />`);
  }
  if (!skip.has("sort") && state.sort && state.sort !== "relevance") {
    parts.push(`<input type="hidden" name="sort" value="${escapeAttr(state.sort)}" />`);
  }
  if (!skip.has("min") && state.min?.trim()) parts.push(`<input type="hidden" name="min" value="${escapeAttr(state.min.trim())}" />`);
  if (!skip.has("max") && state.max?.trim()) parts.push(`<input type="hidden" name="max" value="${escapeAttr(state.max.trim())}" />`);
  if (!skip.has("rating") && state.rating?.trim()) {
    parts.push(`<input type="hidden" name="rating" value="${escapeAttr(state.rating.trim())}" />`);
  }
  if (!skip.has("view") && state.view && state.view !== "grid") {
    parts.push(`<input type="hidden" name="view" value="${escapeAttr(state.view)}" />`);
  }
  return parts.join("\n");
}

function buildProductCard(product: Product, view: "grid" | "list", state: ProductsFilterState): string {
  const href = `/products/${encodeURIComponent(product.slug || product.id || "")}`;
  const variantId = escapeAttr(String(product.variantId ?? ""));
  const slug = escapeAttr(product.slug || product.id || "");
  const productId = escapeAttr(product.id || product.slug || "");
  const name = escapeHtml(product.name || "Untitled Product");
  const image = escapeHtml(product.image || "/assets/images/products/wines/product-12.png");
  const category = escapeHtml(product.categoryLabel || "Shop");
  const price = escapeHtml(formatCurrency(product.price));
  const description = escapeAttr(product.description || "No description available.");
  const categoryLabel = escapeAttr(product.categoryLabel || "");
  const encodedCategoryHandle = escapeAttr(product.category || "uncategorized");
  const numericPrice = String(product.price || 0);
  const oldPrice =
    product.oldPrice && product.oldPrice > product.price
      ? `<del>${escapeHtml(formatCurrency(product.oldPrice))}</del>`
      : "";
  const sp = starPct(product.rating);
  const colClass =
    view === "list" ? "col-12" : "col-xl-3 col-lg-4 col-md-6 col-sm-6";

  const catHref = buildProductsUrl(
    applyFilterPatch(state, {
      category: product.category || "",
      categories: "",
    })
  );

  return `
        <div class="${colClass} lumin-product-card-wrap">
          <div class="single-product lumin-shop-product-card ${view === "list" ? "lumin-shop-product-card--list" : ""}">
            <div class="single-product__thumbnail">
              <div class="single-product__thumbnail--meta-3">
                <button
                  type="button"
                  class="js-quick-add-wishlist bg-transparent border-0 p-0"
                  data-variant-id="${variantId}"
                  data-slug="${slug}"
                  data-id="${productId}"
                  data-name="${name}"
                  data-price="${numericPrice}"
                  data-image="${image}"
                  data-category="${encodedCategoryHandle}"
                  data-category-label="${categoryLabel}"
                  data-description="${description}"
                  aria-label="wishlist"
                ><i class="lastudioicon-heart-2"></i></button>
              </div>
              ${oldPrice ? '<div class="single-product__thumbnail--badge onsale">Sale</div>' : ""}
              <div class="single-product__thumbnail--holder">
                <a href="${href}">
                  <img src="${image}" alt="${name}" width="344" height="370" loading="lazy" decoding="async" />
                </a>
              </div>
              <div class="single-product__thumbnail--meta-2">
                <button
                  type="button"
                  class="js-quick-add-cart bg-transparent border-0 p-0"
                  data-variant-id="${variantId}"
                  aria-label="cart"
                ><i class="lastudioicon-shopping-cart-3"></i></button>
                <a href="/products" aria-label="compare"><i class="lastudioicon-ic_compare_arrows_24px"></i></a>
                <a href="${href}" aria-label="zoom-in"><i class="lastudioicon-search-zoom-in"></i></a>
              </div>
            </div>
            <div class="single-product__info text-center">
              <div class="single-product__info--tags"><a href="${escapeHtml(catHref)}">${category}</a></div>
              <h3 class="single-product__info--title"><a href="${href}">${name}</a></h3>
              <div class="single-product__info--rating lumin-shop-rating mb-2">
                <span class="star-rating"><span style="width: ${sp}%"></span></span>
              </div>
              <div class="single-product__info--price">${oldPrice}<ins>${price}</ins></div>
            </div>
          </div>
        </div>`;
}

export function buildShopWrapperHtml(
  allProducts: Product[],
  filteredProducts: Product[],
  state: ProductsFilterState
): string {
  const view = state.view === "list" ? "list" : "grid";
  const facets = buildFacets(allProducts);
  const selectedCats = parseSelectedCategories(state);
  const sort: ShopSortKey = state.sort || "relevance";

  const minVal =
    state.min?.trim() ||
    String(Math.max(0, Math.floor(facets.priceMin)));
  const maxVal =
    state.max?.trim() ||
    String(Math.max(Math.ceil(facets.priceMax || 1), Number(minVal) || 0));

  const sidebarCategories = facets.categories
    .map((c) => {
      const active = selectedCats.has(c.handle.toLowerCase()) ? " lumin-facet-link--active" : "";
      const href = toggleCategoryHref(state, c.handle);
      return `
                                            <li class="lumin-facet-link${active}">
                                                <a href="${escapeHtml(href)}">
                                                    <span class="lumin-facet-dot"></span>${escapeHtml(c.label)}
                                                    <span class="lumin-facet-count">(${c.count})</span>
                                                </a>
                                            </li>`;
    })
    .join("");

  const collectionLinks = facets.collections.length
    ? `
                                            <li class="lumin-facet-link${!state.collection?.trim() ? " lumin-facet-link--active" : ""}">
                                                <a href="${escapeHtml(buildProductsUrl(applyFilterPatch(state, { collection: "" })))}"><span class="lumin-facet-dot"></span>All collections</a>
                                            </li>
${facets.collections
  .map((c) => {
    const active =
      state.collection?.trim().toLowerCase() === c.handle.toLowerCase()
        ? " lumin-facet-link--active"
        : "";
    const href = buildProductsUrl(applyFilterPatch(state, { collection: c.handle }));
    return `
                                            <li class="lumin-facet-link${active}">
                                                <a href="${escapeHtml(href)}"><span class="lumin-facet-dot"></span>${escapeHtml(c.label)} <span class="lumin-facet-count">(${c.count})</span></a>
                                            </li>`;
  })
  .join("")}`
    : "";

  const ratingLinks = [5, 4, 3, 2, 1]
    .map((n) => {
      const active = state.rating === String(n) ? " lumin-facet-link--active" : "";
      const href = buildProductsUrl(applyFilterPatch(state, { rating: String(n) }));
      return `
                                            <li class="lumin-facet-link${active}">
                                                <a href="${escapeHtml(href)}"><span class="lumin-facet-dot"></span>${n}+ stars</a>
                                            </li>`;
    })
    .join("");

  const categoryJumpOptions = [
    `<option value="${escapeAttr(buildProductsUrl(applyFilterPatch(state, { category: "", categories: "" })))}">All categories</option>`,
    ...facets.categories.map((c) => {
      const url = buildProductsUrl(
        applyFilterPatch(state, { category: c.handle, categories: "" })
      );
      const sel =
        state.category?.trim().toLowerCase() === c.handle.toLowerCase() &&
        !state.categories?.trim()
          ? " selected"
          : "";
      return `<option value="${escapeAttr(url)}"${sel}>${escapeHtml(c.label)} (${c.count})</option>`;
    }),
  ].join("");

  const productCards = filteredProducts.map((p) => buildProductCard(p, view, state)).join("");

  const clearAllHref = buildProductsUrl({});
  const emptyRow =
    filteredProducts.length === 0
      ? allProducts.length === 0
        ? `<div class="col-12"><div class="alert alert-light border text-center mb-0">No products loaded from backend.</div></div>`
        : `<div class="col-12"><div class="alert alert-light border text-center mb-0">No products match these filters. <a href="${escapeHtml(clearAllHref)}">Clear filters</a></div></div>`
      : "";

  const total = filteredProducts.length;
  const catalogTotal = allProducts.length;
  const showingText = `Showing ${total} of ${catalogTotal} products`;

  const sortItems: { key: ShopSortKey; label: string }[] = [
    { key: "price_asc", label: "Sort by Price: Low to High" },
    { key: "price_desc", label: "Sort by Price: High to Low" },
    { key: "alpha_asc", label: "Sort by Name: A to Z" },
    { key: "alpha_desc", label: "Sort by Name: Z to A" },
  ];

  const sortListHtml = sortItems
    .map(({ key, label }) => {
      const active = sort === key ? "active" : "";
      const href = buildProductsUrl(applyFilterPatch(state, { sort: key }));
      return `<li class="${active}"><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
    })
    .join("");

  const gridActive = view === "grid" ? " lumin-view-btn--active" : "";
  const listActive = view === "list" ? " lumin-view-btn--active" : "";

  return `
                <!-- Shop Wrapper Start -->
                <div class="shop-wrapper lumin-shop-page">
                    <div class="row gy-5 align-items-start">
                        <div class="col-lg-3 order-2 order-lg-1">
                            <div class="sidebar-shop-filter-widget lumin-shop-sidebar">
                                    <div class="sidebar-widget-item">
                                        <h4 class="sidebar-widget-item__title">Categories</h4>
                                        <div class="sidebar-widget-item__filter mb-3">
                                            <label class="visually-hidden" for="lumin-category-jump">Jump to category</label>
                                            <select class="form-select form-select-sm lumin-shop-category-select" id="lumin-category-jump" onchange="window.location.href=this.value">
                                                ${categoryJumpOptions}
                                            </select>
                                        </div>
                                        <div class="sidebar-widget-item__filter category-filter">
                                            <ul class="sidebar-widget-item__list lumin-shop-facet-links">
                                                ${sidebarCategories || `<li class="text-muted small">No categories</li>`}
                                            </ul>
                                        </div>
                                    </div>
                                    <div class="sidebar-widget-item">
                                        <h4 class="sidebar-widget-item__title">Price</h4>
                                        <form action="/products" method="get" class="lumin-shop-price-form">
                                            ${buildShopFilterHiddenInputsHtml(state, ["min", "max"])}
                                            <div class="sidebar-widget-item__filter price-range-filter">
                                                <p class="filter-price-value mb-2">
                                                    <span class="d-block small text-muted mb-1">Range (${escapeHtml(formatCurrency(0))} – ${escapeHtml(formatCurrency(Math.ceil(facets.priceMax || 0)))})</span>
                                                    <input type="number" class="input-min form-control form-control-sm d-inline-block" name="min" value="${escapeAttr(minVal)}" min="0" step="1" style="width:6rem" />
                                                    <span class="mx-1">—</span>
                                                    <input type="number" class="input-max form-control form-control-sm d-inline-block" name="max" value="${escapeAttr(maxVal)}" min="0" step="1" style="width:6rem" />
                                                </p>
                                                <button type="submit" class="filter-price-btn w-100">Apply price</button>
                                            </div>
                                        </form>
                                    </div>
                                    ${
                                      collectionLinks
                                        ? `<div class="sidebar-widget-item">
                                        <h4 class="sidebar-widget-item__title">Collection</h4>
                                        <div class="sidebar-widget-item__filter">
                                            <ul class="sidebar-widget-item__list lumin-shop-facet-links">
                                                ${collectionLinks}
                                            </ul>
                                        </div>
                                    </div>`
                                        : ""
                                    }
                                    <div class="sidebar-widget-item">
                                        <h4 class="sidebar-widget-item__title">Ratings</h4>
                                        <div class="sidebar-widget-item__filter">
                                            <ul class="sidebar-widget-item__list lumin-shop-facet-links">
                                                <li class="lumin-facet-link${!state.rating?.trim() ? " lumin-facet-link--active" : ""}">
                                                    <a href="${escapeHtml(buildProductsUrl(applyFilterPatch(state, { rating: "" })))}"><span class="lumin-facet-dot"></span>Any rating</a>
                                                </li>
                                                ${ratingLinks}
                                            </ul>
                                        </div>
                                    </div>
                            </div>
                        </div>
                        <div class="col-lg-9 order-1 order-lg-2">
                            <div class="shop-filter lumin-shop-toolbar mb-3">
                                <div class="shop-filter-default justify-content-between align-items-center flex-wrap gap-2">
                                    <div class="shop-filter-count d-none d-sm-block">${escapeHtml(showingText)}</div>
                                    <div class="d-flex align-items-center gap-2 ms-auto flex-wrap justify-content-end">
                                        <div class="shop-filter-sort-by">
                                            <div class="shop-filter-sort-by__label">
                                                <span>${escapeHtml(getSortLabel(sort))}</span>
                                                <i class="lastudioicon-down-arrow"></i>
                                            </div>
                                            <ul class="shop-filter-sort-by__dropdown">
                                                ${sortListHtml}
                                            </ul>
                                        </div>
                                        <div class="lumin-shop-view-toggle btn-group" role="group" aria-label="Layout">
                                            <a href="${escapeHtml(buildProductsUrl(applyFilterPatch(state, { view: "grid" })))}" class="btn btn-sm btn-outline-secondary lumin-view-btn${gridActive}" aria-label="Grid view"><i class="lastudioicon-menu-4-2"></i></a>
                                            <a href="${escapeHtml(buildProductsUrl(applyFilterPatch(state, { view: "list" })))}" class="btn btn-sm btn-outline-secondary lumin-view-btn${listActive}" aria-label="List view"><i class="lastudioicon-list-bullet-1"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row gy-4 lumin-products-row lumin-products-row--${view}">
                                ${productCards || emptyRow}
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Shop Wrapper End -->`;
}
