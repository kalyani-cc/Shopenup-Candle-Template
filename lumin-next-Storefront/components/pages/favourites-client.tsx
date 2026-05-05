"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addToCart } from "@/lib/shopenup/cart";
import { addToWishlist, listWishlistProducts, removeFromWishlist, type FavouriteProduct } from "@/lib/shopenup/wishlist";
import { formatCurrency } from "@/lib/utils";

type FavouritesClientProps = {
  initialAdd?: FavouriteProduct | null;
};

export function FavouritesClient({ initialAdd }: FavouritesClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<FavouriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
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
    };
    void load();
  }, []);

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
    <section className="container-fluid custom-container py-5">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div>
          <h2 className="fw-semibold mb-1">My Wishlist</h2>
          <p className="text-muted small mb-0">{items.length} item(s) saved for later</p>
        </div>
        <Link href="/products" className="btn btn-sm btn-outline-dark rounded-pill px-3">
          Continue Shopping
        </Link>
      </div>

      <div className="row g-4">
        {items.map((item) => (
          <div
            className="col-xl-3 col-lg-4 col-md-6"
            key={item.variantId || item.slug}
          >
            <div
              className="card h-100 border-0 shadow-sm overflow-hidden"
              style={{ borderRadius: "14px" }}
            >
  
              {/* IMAGE */}
              <div className="position-relative bg-light">
                <Link href={`/products/${encodeURIComponent(item.slug || item.id || "")}`}>
                  <img
                    src={item.image || "/assets/images/products/wines/product-12.png"}
                    alt={item.name}
                    className="card-img-top"
                    style={{
                      height: "170px",
                      objectFit: "cover",
                      transition: "transform 0.25s ease"
                    }}
                  />
                </Link>
  
                {/* REMOVE BUTTON */}
                <button
                  className="btn btn-light btn-sm position-absolute top-0 end-0 m-2 shadow-sm border-0 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "30px", height: "30px" }}
                  onClick={async () => {
                    await removeFromWishlist(item.variantId);
                    setItems((prev) =>
                      prev.filter((p) => p.variantId !== item.variantId)
                    );
                  }}
                >
                  ✕
                </button>
              </div>
  
              {/* CONTENT */}
              <div className="card-body d-flex flex-column p-3">
  
                <h6 className="mb-1 fw-semibold">{item.name}</h6>
{/*   
                <p
                  className="text-muted small mb-3"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "2.5rem"
                  }}
                >
                  {item.description || "No description available"}
                </p> */}
  
                <div className="d-flex align-items-center justify-content-between mt-auto mb-3">
                  <span className="text-muted small">Price</span>
                  <div className="fw-bold">
                    {formatCurrency(item.price)}
                  </div>
                </div>
  
                <button
                  type="button"
                  className="btn btn-dark w-100 rounded-pill py-2 d-inline-flex align-items-center justify-content-center"
                  aria-label="Add to cart"
                  title="Add to cart"
                  onClick={async () => {
                    if (!item.variantId) return;
                    await addToCart(item.variantId, 1);
                  }}
                >
                  <i className="lastudioicon-shopping-cart-3" style={{ fontSize: "1.15rem" }} aria-hidden="true" />
                </button>
  
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

