import Link from "next/link";
import type { Product } from "@/lib/store-data";
import { formatCurrency } from "@/lib/utils";

function starRatingWidthPercent(rating: number | undefined): number {
  const r = Number(rating);
  if (!Number.isFinite(r) || r <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((r / 5) * 100)));
}

type HomeProductCardProps = {
  product: Product;
  /** e.g. `"single-product"` or swiper slide classes */
  rootClassName?: string;
};

export function HomeProductCard({ product, rootClassName = "single-product" }: HomeProductCardProps) {
  const href = `/products/${encodeURIComponent(product.slug || product.id || "")}`;
  const variantId = product.variantId || "";
  const slug = product.slug || product.id || "";
  const productId = product.id || product.slug || "";
  const rawName = product.name || "Untitled Product";
  const image = product.image || "/assets/images/products/wines/product-12.png";
  const category = product.categoryLabel || "Candles";
  const price = formatCurrency(product.price);
  const description = product.description || "No description available.";
  const categoryLabel = product.categoryLabel || "";
  const categoryHandle = product.category || "uncategorized";
  const numericPrice = String(product.price || 0);
  const categoryHref = `/products?category=${encodeURIComponent(product.category || "uncategorized")}`;
  const showSale = product.oldPrice && product.oldPrice > product.price;
  const starPct = starRatingWidthPercent(product.rating);

  return (
    <div className={rootClassName}>
      <div className="single-product__thumbnail">
        <div className="single-product__thumbnail--meta-3">
          <button
            type="button"
            className="js-quick-add-wishlist bg-transparent border-0 p-0"
            data-variant-id={variantId}
            data-slug={slug}
            data-id={productId}
            data-name={rawName}
            data-price={numericPrice}
            data-image={image}
            data-category={categoryHandle}
            data-category-label={categoryLabel}
            data-description={description}
            aria-label="wishlist"
          >
            <i className="lastudioicon-heart-2" />
          </button>
        </div>
        {showSale ? <div className="single-product__thumbnail--badge onsale">Sale</div> : null}
        <div className="single-product__thumbnail--holder">
          <Link href={href}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN URLs */}
            <img src={image} alt={rawName} width={392} height={400} loading="lazy" decoding="async" />
          </Link>
        </div>
        <div className="single-product__thumbnail--meta-2">
          <button
            type="button"
            className="js-quick-add-cart bg-transparent border-0 p-0"
            data-variant-id={variantId}
            aria-label="cart"
          >
            <i className="lastudioicon-shopping-cart-3" />
          </button>
          <Link href={href} aria-label="zoom-in">
            <i className="lastudioicon-search-zoom-in" />
          </Link>
        </div>
      </div>
      <div className="single-product__info text-center">
        <div className="single-product__info--tags">
          <Link href={categoryHref}>{category}</Link>
        </div>
        <h3 className="single-product__info--title">
          <Link href={href}>{rawName}</Link>
        </h3>
        <div className="single-product__info--price">
          {showSale ? <del>{formatCurrency(product.oldPrice!)}</del> : null}
          <ins>{price}</ins>
        </div>
        <div className="single-product__info--rating">
          <span className="star-rating">
            <span style={{ width: `${starPct}%` }} />
          </span>
        </div>
      </div>
    </div>
  );
}
