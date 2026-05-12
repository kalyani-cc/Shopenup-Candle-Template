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
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h2 className="fw-bold mb-1">Wishlist</h2>
          <span className="text-muted small">
            {items.length} saved items
          </span>
        </div>
  
        <Link href="/products" className="text-dark text-decoration-underline small">
          Continue shopping
        </Link>
      </div>
  
      {/* GRID */}
      <div className="wishlist-grid">
        {items.map((item) => (
          <div key={item.variantId || item.slug} className="wishlist-item">
            
            {/* IMAGE */}
            <div className="image-wrapper">
              <Link href={`/products/${item.slug}`}>
                <img
                  src={item.image || "/assets/images/products/wines/product-12.png"}
                  alt={item.name}
                />
              </Link>
  
              {/* HOVER ACTIONS */}
              <div className="overlay">
                <button
                  className="action-btn dark"
                  onClick={async () => {
                    if (!item.variantId) return;
                    await addToCart(item.variantId, 1);
                  }}
                >
                  Add to Cart
                </button>
  
                <button
                  className="action-btn light"
                  onClick={async () => {
                    await removeFromWishlist(item.variantId);
                    setItems((prev) =>
                      prev.filter((p) => p.variantId !== item.variantId)
                    );
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
  
            {/* INFO */}
            <div className="mt-3">
              <h6 className="mb-1 product-title">{item.name}</h6>
              <span className="price">{formatCurrency(item.price)}</span>
            </div>
          </div>
        ))}
      </div>
  
      {/* STYLES */}
      <style jsx>{`
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 30px;
        }
  
        .wishlist-item {
          cursor: pointer;
        }
  
        .image-wrapper {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: #f8f8f8;
        }
  
        .image-wrapper img {
          width: 100%;
          height: 260px;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
  
        .wishlist-item:hover img {
          transform: scale(1.08);
        }
  
        /* OVERLAY */
        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          opacity: 0;
          transition: 0.3s ease;
        }
  
        .wishlist-item:hover .overlay {
          opacity: 1;
        }
  
        .action-btn {
          border: none;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          cursor: pointer;
          transition: 0.2s;
        }
  
        .action-btn.dark {
          background: #000;
          color: #fff;
        }
  
        .action-btn.dark:hover {
          background: #222;
        }
  
        .action-btn.light {
          background: #fff;
        }
  
        .action-btn.light:hover {
          background: #eee;
        }
  
        .product-title {
          font-size: 14px;
          font-weight: 500;
        }
  
        .price {
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>
    </section>
  );
}

