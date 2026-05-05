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
  return escapeHtml(value).replace(/\n/g, " ");
}

function starRatingWidthPercent(rating: number | undefined): number {
  const r = Number(rating);
  if (!Number.isFinite(r) || r <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((r / 5) * 100)));
}

/** Product cards aligned with `app/products/page.tsx` (QuickAddHandlers + wishlist sync). */
export function buildHomeNewArrivalGridHtml(products: Product[], limit = 8): string {
  const slice = products.slice(0, limit);
  if (!slice.length) {
    return `<div class="col-12"><p class="text-center text-muted py-5 mb-0">No products available yet.</p></div>`;
  }

  return slice
    .map((product) => {
      const href = `/products/${encodeURIComponent(product.slug || product.id || "")}`;
      const variantId = escapeAttr(product.variantId || "");
      const slug = escapeAttr(product.slug || product.id || "");
      const productId = escapeAttr(product.id || product.slug || "");
      const rawName = product.name || "Untitled Product";
      const name = escapeHtml(rawName);
      const nameAttr = escapeAttr(rawName);
      const image = escapeHtml(product.image || "/assets/images/products/wines/product-12.png");
      const category = escapeHtml(product.categoryLabel || "Candles");
      const price = escapeHtml(formatCurrency(product.price));
      const description = escapeAttr(product.description || "No description available.");
      const categoryLabel = escapeAttr(product.categoryLabel || "");
      const categoryHandle = escapeAttr(product.category || "uncategorized");
      const numericPrice = String(product.price || 0);
      const categoryHref = `/products?category=${encodeURIComponent(product.category || "uncategorized")}`;
      const oldPrice =
        product.oldPrice && product.oldPrice > product.price
          ? `<del>${escapeHtml(formatCurrency(product.oldPrice))}</del>`
          : "";
      const starPct = starRatingWidthPercent(product.rating);

      return `
        <div class="col-xl-3 col-md-4 col-sm-6">
          <div class="single-product">
            <div class="single-product__thumbnail">
              <div class="single-product__thumbnail--meta-3">
                <button
                  type="button"
                  class="js-quick-add-wishlist bg-transparent border-0 p-0"
                  data-variant-id="${variantId}"
                  data-slug="${slug}"
                  data-id="${productId}"
                  data-name="${nameAttr}"
                  data-price="${numericPrice}"
                  data-image="${image}"
                  data-category="${categoryHandle}"
                  data-category-label="${categoryLabel}"
                  data-description="${description}"
                  aria-label="wishlist"
                ><i class="lastudioicon-heart-2"></i></button>
              </div>
              ${oldPrice ? '<div class="single-product__thumbnail--badge onsale">Sale</div>' : ""}
              <div class="single-product__thumbnail--holder">
                <a href="${href}">
                  <img src="${image}" alt="${name}" width="392" height="400" loading="lazy" decoding="async" />
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
              <div class="single-product__info--tags"><a href="${categoryHref}">${category}</a></div>
              <h3 class="single-product__info--title"><a href="${href}">${name}</a></h3>
              <div class="single-product__info--price">${oldPrice}<ins>${price}</ins></div>
              <div class="single-product__info--rating">
                <span class="star-rating">
                  <span style="width: ${starPct}%"></span>
                </span>
              </div>
            </div>
          </div>
        </div>`;
    })
    .join("");
}

/** Swap static index “New arrival” grid for API-driven products; point “View more” at /products. */
export function injectHomeNewArrivalSection(markup: string, products: Product[]): string {
  const grid = buildHomeNewArrivalGridHtml(products, 8);
  const block = `<!-- Product wrapper Start -->
                <div class="product-wrapper">
                    <div class="row g-xxl-4">
${grid}
                    </div>
                </div>
                <!-- Product wrapper End -->`;

  const next = markup.replace(/<!--\s*Product wrapper Start\s*-->[\s\S]*?<!--\s*Product wrapper End\s*-->/i, block);
  return next.replace(/<a class="(view-more-btn[^"]*)" href="#">/g, '<a class="$1" href="/products">');
}
