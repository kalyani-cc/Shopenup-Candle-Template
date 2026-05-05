import { listProducts } from "@/lib/shopenup/product";
import { formatCurrency } from "@/lib/utils";
import {
  finalizeLuminTemplateMarkup,
  loadLuminTemplate,
  renderTransformedLuminMarkup,
  transformLuminTemplateMarkup
} from "@/lib/render-lumin-template";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams?: {
    q?: string;
    category?: string;
    sort?: string;
  };
};

type SortKey = "alpha_asc" | "alpha_desc" | "price_asc" | "price_desc";

function getSortLabel(sort: SortKey): string {
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
      return "Sort by Name: A to Z";
  }
}

function buildProductsUrl(params: { q?: string; category?: string; sort: SortKey }): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  qs.set("sort", params.sort);
  return `/products?${qs.toString()}`;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [products, shopTemplate] = await Promise.all([listProducts(48), loadLuminTemplate("shop-fullwidth.html")]);
  const query = (searchParams?.q || "").trim().toLowerCase();
  const categoryHandle = (searchParams?.category || "").trim().toLowerCase();
  const rawSort = (searchParams?.sort || "").trim().toLowerCase();
  const sort: SortKey =
    rawSort === "alpha_desc" || rawSort === "price_asc" || rawSort === "price_desc" ? rawSort : "alpha_asc";

  let filteredProducts = products;
  if (categoryHandle) {
    filteredProducts = filteredProducts.filter(
      (product) => (product.category || "").toLowerCase() === categoryHandle
    );
  }
  if (query) {
    filteredProducts = filteredProducts.filter((product) =>
      `${product.name} ${product.description} ${product.categoryLabel || ""} ${product.collectionLabel || ""}`
        .toLowerCase()
        .includes(query)
    );
  }

  filteredProducts = [...filteredProducts].sort((a, b) => {
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    if (sort === "alpha_asc") return nameA.localeCompare(nameB);
    if (sort === "alpha_desc") return nameB.localeCompare(nameA);
    if (sort === "price_asc") return (a.price || 0) - (b.price || 0);
    return (b.price || 0) - (a.price || 0);
  });

  const productCardsHtml = filteredProducts
    .map((product) => {
      const href = `/products/${encodeURIComponent(product.slug || product.id || "")}`;
      const variantId = escapeAttr(product.variantId || "");
      const slug = escapeAttr(product.slug || product.id || "");
      const productId = escapeAttr(product.id || product.slug || "");
      const name = escapeHtml(product.name || "Untitled Product");
      const image = escapeHtml(product.image || "/assets/images/products/wines/product-12.png");
      const category = escapeHtml(product.categoryLabel || "Candles");
      const price = escapeHtml(formatCurrency(product.price));
      const description = escapeAttr(product.description || "No description available.");
      const categoryLabel = escapeAttr(product.categoryLabel || "");
      const encodedCategoryHandle = escapeAttr(product.category || "uncategorized");
      const numericPrice = String(product.price || 0);
      const oldPrice =
        product.oldPrice && product.oldPrice > product.price
          ? `<del>${escapeHtml(formatCurrency(product.oldPrice))}</del>`
          : "";

      return `
        <div class="col-lg-3 col-md-4 col-sm-6">
          <div class="single-product">
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
                  <img src="${image}" alt="${name}" width="344" height="370" />
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
              <div class="single-product__info--tags"><a href="/products">${category}</a></div>
              <h3 class="single-product__info--title"><a href="${href}">${name}</a></h3>
              <div class="single-product__info--price">${oldPrice}<ins>${price}</ins></div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const emptyMessage = query
    ? `No products found for "${searchParams?.q || ""}".`
    : categoryHandle
      ? "No products in this category."
      : `No products loaded from backend (${process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL || "http://localhost:9000"}).`;

  const dynamicGridHtml =
    filteredProducts.length > 0
      ? productCardsHtml
      : `<div class="col-12"><div class="alert alert-light border text-center">${escapeHtml(emptyMessage)}</div></div>`;

  const templateWithProducts = shopTemplate
    .replace(
      /<div class="shop-filter-count d-none d-sm-block">[\s\S]*?<\/div>/i,
      `<div class="shop-filter-count d-none d-sm-block">Showing 1-${Math.min(filteredProducts.length, 12)} of ${
        filteredProducts.length
      } results</div>`
    )
    .replace(
      /<div class="shop-filter-sort-by">[\s\S]*?<\/div>\s*<!--\s*Shop Filter Sort By End\s*-->/i,
      `<div class="shop-filter-sort-by">
                            <div class="shop-filter-sort-by__label">
                                <span>${escapeHtml(getSortLabel(sort))}</span>
                                <i class="lastudioicon-down-arrow"></i>
                            </div>
                            <ul class="shop-filter-sort-by__dropdown">
                                <li class="${sort === "alpha_asc" ? "active" : ""}">
                                    <a href="${buildProductsUrl({
                                      q: searchParams?.q,
                                      category: searchParams?.category,
                                      sort: "alpha_asc"
                                    })}">Sort by Name: A to Z</a>
                                </li>
                                <li class="${sort === "alpha_desc" ? "active" : ""}">
                                    <a href="${buildProductsUrl({
                                      q: searchParams?.q,
                                      category: searchParams?.category,
                                      sort: "alpha_desc"
                                    })}">Sort by Name: Z to A</a>
                                </li>
                                <li class="${sort === "price_asc" ? "active" : ""}">
                                    <a href="${buildProductsUrl({
                                      q: searchParams?.q,
                                      category: searchParams?.category,
                                      sort: "price_asc"
                                    })}">Sort by Price: <i class="lastudioicon-arrow-up"></i></a>
                                </li>
                                <li class="${sort === "price_desc" ? "active" : ""}">
                                    <a href="${buildProductsUrl({
                                      q: searchParams?.q,
                                      category: searchParams?.category,
                                      sort: "price_desc"
                                    })}">Sort by Price: <i class="lastudioicon-arrow-down"></i></a>
                                </li>
                            </ul>
                        </div>
                        <!-- Shop Filter Sort By End -->`
    )
    .replace(
      /<div class="shop-wrapper">[\s\S]*?<!-- Shop Wrapper End -->/i,
      `<div class="shop-wrapper"><div class="row">${dynamicGridHtml}</div></div><!-- Shop Wrapper End -->`
    );

  let pageMarkup = transformLuminTemplateMarkup(templateWithProducts);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return renderTransformedLuminMarkup(pageMarkup);
}
