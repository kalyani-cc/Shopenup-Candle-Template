"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { addToWishlist, listWishlistProducts, type FavouriteProduct } from "@/lib/shopenup/wishlist";
import { TrashBinIcon } from "@/components/ui/trash-bin-icon";
import { formatCurrency } from "@/lib/utils";

type FavouritesClientProps = {
  initialAdd?: FavouriteProduct | null;
};

function starRatingWidthPercent(rating: number | undefined): number {
  const r = Number(rating);
  if (!Number.isFinite(r) || r <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((r / 5) * 100)));
}

export function FavouritesClient({ initialAdd }: FavouritesClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<FavouriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await listWishlistProducts();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshItems = useCallback(async () => {
    try {
      const list = await listWishlistProducts();
      setItems(list);
    } catch {
      /* keep current list */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onWishlistChanged = () => {
      void refreshItems();
    };
    window.addEventListener("lumin_next:wishlist_changed", onWishlistChanged);
    return () => window.removeEventListener("lumin_next:wishlist_changed", onWishlistChanged);
  }, [refreshItems]);

  useEffect(() => {
    const run = async () => {
      if (!initialAdd?.variantId) {
        return;
      }
      try {
        await addToWishlist(initialAdd);
      } catch {
        // ignore add error; load below still runs and shows current state
      } finally {
        router.replace("/wishlist");
        const list = await listWishlistProducts();
        setItems(list);
        setLoading(false);
      }
    };
    void run();
  }, [initialAdd, router]);

  if (loading) {
    return (
      <section className="container-fluid custom-container py-5">
        <p className="text-center mb-0">Loading wishlist...</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="container-fluid custom-container py-5">
        <p className="text-center text-danger mb-0">{error}</p>
      </section>
    );
  }
  if (!items.length) {
    return (
      <section className="container-fluid custom-container py-5">
        <p className="text-center mb-0">No wishlist items yet.</p>
      </section>
    );
  }

  return (
    <section className="container-fluid custom-container py-5 lumin-page-content">
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h2 className="fw-bold mb-1">Wishlist</h2>
          <span className="text-muted small">{items.length} saved items</span>
        </div>
        <Link href="/products" className="text-dark text-decoration-underline small">
          Continue shopping
        </Link>
      </div>

      <div className="shop-wrapper lumin-shop-page lumin-wishlist-page">
        <div className="row gy-4 lumin-products-row lumin-products-row--grid">
          {items.map((item) => {
            const href = `/products/${encodeURIComponent(item.slug || item.id || "")}`;
            const variantId = item.variantId || "";
            const slug = item.slug || item.id || "";
            const productId = item.id || item.slug || "";
            const rawName = item.name || "Untitled Product";
            const image = item.image || "/assets/images/products/wines/product-12.png";
            const category = item.categoryLabel || "Shop";
            const categoryHandle = item.category || "uncategorized";
            const numericPrice = String(item.price || 0);
            const description = item.description || "No description available.";
            const categoryLabel = item.categoryLabel || "";
            const categoryHref = `/products?category=${encodeURIComponent(categoryHandle)}`;
            const starPct = starRatingWidthPercent(item.rating);

            return (
              <div key={item.variantId || item.slug} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 lumin-product-card-wrap">
                <div className="single-product lumin-shop-product-card">
                  <div className="single-product__thumbnail">
                    <div className="single-product__thumbnail--meta-3">
                      <button
                        type="button"
                        className="js-quick-add-wishlist bg-transparent border-0 p-0 lumin-wishlist-heart--active"
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
                    <div className="single-product__thumbnail--holder">
                      <Link href={href}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote URLs */}
                        <img src={image} alt={rawName} width={344} height={370} loading="lazy" decoding="async" />
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
                      <button
                        type="button"
                        className="js-quick-add-wishlist bg-transparent border-0 p-0 lumin-wishlist-heart--active"
                        data-variant-id={variantId}
                        data-slug={slug}
                        data-id={productId}
                        data-name={rawName}
                        data-price={numericPrice}
                        data-image={image}
                        data-category={categoryHandle}
                        data-category-label={categoryLabel}
                        data-description={description}
                        aria-label="Remove from wishlist"
                        title="Remove from wishlist"
                      >
                        <TrashBinIcon />
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
                    <div className="single-product__info--rating lumin-shop-rating mb-2">
                      <span className="star-rating">
                        <span style={{ width: `${starPct}%` }} />
                      </span>
                    </div>
                    <div className="single-product__info--price">
                      <ins>{formatCurrency(item.price)}</ins>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
