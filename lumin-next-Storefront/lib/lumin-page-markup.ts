/**
 * Server-only builders for Lumin page bodies. App routes stay TSX-only; HTML files are read here.
 */
import {
  BLOG_POSTS_PER_PAGE,
  injectBlogListingHero,
  injectBlogListingItems,
  injectBlogPagination,
} from "@/lib/blog-list-html";
import {
  buildShopWrapperHtml,
  parseProductsFilterState,
  type ProductsFilterState,
  type ShopSortKey,
} from "@/lib/products-shop-html";
import {
  finalizeLuminTemplateMarkup,
  loadLuminTemplate,
  transformLuminTemplateMarkup,
} from "@/lib/render-lumin-template";
import { listProducts } from "@/lib/shopenup/product";
import type { BlogPost, Product } from "@/lib/store-data";

/** Demo / legacy template slugs (formerly `app/[slug]/page.tsx`). */
export const DEMO_TEMPLATE_SLUGS = new Set<string>([
  "blog-left-sidebar",
  "blog-right-sidebar",
  "blog-single",
  "coming-soon",
  "compare",
  "empty-cart",
  "faqs",
  "index-2",
  "our-team",
  "product-single",
  "product-single-affiliate",
  "product-single-carousel",
  "product-single-countdown",
  "product-single-variable",
  "shop-3-columns",
  "shop-4-columns",
  "shop-masonry",
  "shop-sidebar",
  "term-of-use",
]);

function injectProfileAccountDetailRoot(markup: string): string {
  return markup.replace(
    /<div class="my-account-detail">\s*<form action="#">[\s\S]*?<\/form>\s*<\/div>/,
    '<div class="my-account-detail"><div id="lumin-profile-account-detail-root"></div></div>'
  );
}

function injectProfileOrdersRoot(markup: string): string {
  return markup.replace(
    /<div class="my-account-orders">\s*<div class="my-account-table table-responsive">[\s\S]*?<\/div>\s*<\/div>\s*<!-- My Account Orders End -->/,
    '<div class="my-account-orders"><div id="lumin-profile-orders-root"></div></div>\n                            <!-- My Account Orders End -->'
  );
}

function injectProfileAddressesRoot(markup: string): string {
  return markup.replace(
    /<div class="my-account-address">[\s\S]*?<\/div>\s*<!-- My Account Address End -->/i,
    '<div class="my-account-address"><div id="lumin-profile-addresses-root"></div></div>\n                            <!-- My Account Address End -->'
  );
}

function injectProfileLogoutRoot(markup: string): string {
  return markup.replace(
    /<li>\s*<a class="account-btn" href="[^"]*">\s*Logout\s*<\/a>\s*<\/li>/i,
    '<li><div id="lumin-profile-logout-root"></div></li>'
  );
}

function removeDashboardAndDownloadTabs(markup: string): string {
  return markup
    .replace(
      /<li>\s*<button class="account-btn active" data-bs-toggle="tab" data-bs-target="#dashboard" type="button">\s*Dashboard\s*<\/button>\s*<\/li>/i,
      ""
    )
    .replace(
      /<li>\s*<button class="account-btn" data-bs-toggle="tab" data-bs-target="#download" type="button">\s*Download\s*<\/button>\s*<\/li>/i,
      ""
    )
    .replace(
      /<div class="tab-pane fade show active" id="dashboard">[\s\S]*?<\/div>\s*<div class="tab-pane fade" id="orders">/i,
      '<div class="tab-pane fade show active" id="orders">'
    )
    .replace(
      /<div class="tab-pane fade" id="download">[\s\S]*?<\/div>\s*<div class="tab-pane fade" id="address">/i,
      '<div class="tab-pane fade" id="address">'
    )
    .replace(
      /<button class="account-btn"\s+data-bs-toggle="tab"\s+data-bs-target="#orders"\s+type="button">/i,
      '<button class="account-btn active" data-bs-toggle="tab" data-bs-target="#orders" type="button">'
    );
}

export async function getContactPageMarkup(): Promise<string> {
  const html = await loadLuminTemplate("contact-us.html");
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return pageMarkup;
}

/** Remove HTTrack demo cart rows / payment blocks; checkout is filled from the live cart API. */
export function injectCheckoutPageCleanup(markup: string): string {
  let out = markup.replace(
    'class="checkout-section section-padding-2"',
    'class="checkout-section section-padding-2 lumin-checkout-pending"'
  );

  out = out.replace(
    /(<div class="checkout-details__order-review">[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>)/i,
    `$1<tr data-lumin-placeholder="1"><td class="product-name" colspan="2"><span class="lumin-checkout-loading">Loading your cart…</span></td></tr>$2`
  );

  out = out.replace(
    /(<tr class="cart-subtotal">[\s\S]*?<span>)[^<]*(<\/span>)/i,
    "$1—$2"
  );
  out = out.replace(
    /(<tr class="order-total">[\s\S]*?<span>)\s*[^<]*\s*(<\/span>)/i,
    "$1—$2"
  );

  out = out.replace(
    /(<tr class="cart-shipping">[\s\S]*?<td data-title="Shipping">)[\s\S]*?(<\/td>)/i,
    `$1<span class="lumin-checkout-loading">Loading shipping options…</span>$2`
  );

  out = out.replace(
    /(<div class="checkout-details__payment-method">\s*<div class="accordion" id="payment-method">)\s*<form action="#">[\s\S]*?<\/form>/i,
    `$1<p class="lumin-checkout-loading mb-0">Loading payment options…</p>`
  );

  return out;
}

export async function getCheckoutPageMarkup(): Promise<string> {
  const html = await loadLuminTemplate("checkout.html");
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = injectCheckoutPageCleanup(pageMarkup);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return pageMarkup;
}

export async function getOrderThankYouMarkup(): Promise<string> {
  const html = await loadLuminTemplate("thank-you.html");
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return pageMarkup;
}

export async function getProfilePageMarkup(): Promise<string> {
  const html = await loadLuminTemplate("my-account.html");
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = removeDashboardAndDownloadTabs(pageMarkup);
  pageMarkup = injectProfileLogoutRoot(pageMarkup);
  pageMarkup = injectProfileOrdersRoot(pageMarkup);
  pageMarkup = injectProfileAddressesRoot(pageMarkup);
  pageMarkup = injectProfileAccountDetailRoot(pageMarkup);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return pageMarkup;
}

export async function getBlogListingMarkup(
  pagePosts: BlogPost[],
  currentPage: number,
  totalPages: number
): Promise<string> {
  const blogTemplate = await loadLuminTemplate("blog.html");
  let pageMarkup = transformLuminTemplateMarkup(blogTemplate);
  pageMarkup = injectBlogListingHero(pageMarkup);
  pageMarkup = injectBlogListingItems(pageMarkup, pagePosts);
  pageMarkup = injectBlogPagination(pageMarkup, currentPage, totalPages);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return pageMarkup;
}

function parseCreatedMs(iso?: string): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function parseCategoryFilters(state: ProductsFilterState): string[] {
  const out: string[] = [];
  if (state.categories?.trim()) {
    state.categories.split(",").forEach((s: string) => {
      const t = s.trim().toLowerCase();
      if (t) out.push(t);
    });
  }
  if (state.category?.trim()) {
    out.push(state.category.trim().toLowerCase());
  }
  return [...new Set(out)];
}

function applyProductFilters(products: Product[], state: ProductsFilterState): Product[] {
  const query = (state.q || "").trim().toLowerCase();
  const catFilters = parseCategoryFilters(state);
  const collectionHandle = (state.collection || "").trim().toLowerCase();
  const minP = state.min?.trim() !== undefined && state.min !== "" ? Number(state.min) : NaN;
  const maxP = state.max?.trim() !== undefined && state.max !== "" ? Number(state.max) : NaN;
  const minOk = Number.isFinite(minP);
  const maxOk = Number.isFinite(maxP);
  const ratingMin = state.rating?.trim() ? Number(state.rating) : NaN;
  const ratingOk = Number.isFinite(ratingMin) && ratingMin >= 1 && ratingMin <= 5;

  let list = products;

  if (catFilters.length) {
    list = list.filter((p) => catFilters.includes((p.category || "").trim().toLowerCase()));
  }

  if (collectionHandle) {
    list = list.filter((p) => (p.collection || "").trim().toLowerCase() === collectionHandle);
  }

  if (query) {
    list = list.filter((product) =>
      `${product.name} ${product.description} ${product.categoryLabel || ""} ${product.collectionLabel || ""}`
        .toLowerCase()
        .includes(query)
    );
  }

  if (minOk || maxOk) {
    list = list.filter((p) => {
      const price = Number(p.price) || 0;
      if (minOk && price < minP) return false;
      if (maxOk && price > maxP) return false;
      return true;
    });
  }

  if (ratingOk) {
    list = list.filter((p) => (Number(p.rating) || 0) >= ratingMin);
  }

  return list;
}

function sortProducts(list: Product[], sort: ShopSortKey, query: string): Product[] {
  const q = query.trim().toLowerCase();
  const arr = [...list];

  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price_desc":
      return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "alpha_desc":
      return arr.sort((a, b) =>
        (b.name || "").toLowerCase().localeCompare((a.name || "").toLowerCase())
      );
    case "rated":
      return arr.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    case "newest":
      return arr.sort((a, b) => parseCreatedMs(b.createdAt) - parseCreatedMs(a.createdAt));
    case "popular":
      return arr.sort((a, b) => {
        const rc = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (rc !== 0) return rc;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });
    case "relevance":
      if (q) {
        return arr.sort((a, b) => {
          const na = (a.name || "").toLowerCase();
          const nb = (b.name || "").toLowerCase();
          const sa = na.includes(q) ? 0 : 1;
          const sb = nb.includes(q) ? 0 : 1;
          if (sa !== sb) return sa - sb;
          return na.localeCompare(nb);
        });
      }
      return arr.sort((a, b) =>
        (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase())
      );
    case "alpha_asc":
    default:
      return arr.sort((a, b) =>
        (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase())
      );
  }
}

export async function getProductsListingMarkup(
  searchParams: Record<string, string | string[] | undefined>
): Promise<string> {
  const [allProducts, shopTemplate] = await Promise.all([listProducts(200), loadLuminTemplate("shop-sidebar.html")]);

  const state = parseProductsFilterState(searchParams || {});
  let filtered = applyProductFilters(allProducts, state);
  filtered = sortProducts(filtered, state.sort || "relevance", state.q || "");

  const shopWrapperHtml = buildShopWrapperHtml(allProducts, filtered, state);

  const templateWithProducts = shopTemplate
    .replace(/<h2 class="breadcrumb-wrapper__title">\s*Shop Sidebar\s*<\/h2>/i, `<h2 class="breadcrumb-wrapper__title">Shop</h2>`)
    .replace(/<!-- Shop Wrapper Start -->[\s\S]*?<!-- Shop Wrapper End -->/, shopWrapperHtml);

  let pageMarkup = transformLuminTemplateMarkup(templateWithProducts);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return pageMarkup;
}

export async function getDemoTemplateMarkup(slug: string): Promise<string | null> {
  const key = slug.trim().toLowerCase();
  if (!DEMO_TEMPLATE_SLUGS.has(key)) {
    return null;
  }
  const html = await loadLuminTemplate(`${key}.html`);
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return pageMarkup;
}
