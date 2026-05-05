"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/store-data";
import { addToWishlist, isFavourite, removeFromWishlist } from "@/lib/shopenup/wishlist";

type FavouriteToggleButtonProps = {
  product: Product;
  className?: string;
  iconOnly?: boolean;
};

export function FavouriteToggleButton({ product, className, iconOnly }: FavouriteToggleButtonProps) {
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    isFavourite(product.variantId)
      .then((result) => {
        if (mounted) setFav(result);
      })
      .catch(() => {
        if (mounted) setFav(false);
      });
    return () => {
      mounted = false;
    };
  }, [product.variantId]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (fav) {
        await removeFromWishlist(product.variantId);
        setFav(false);
      } else {
        await addToWishlist(product);
        setFav(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const base = [
    "btn",
    iconOnly ? "lumin-icon-action-btn" : "btn-lg",
    iconOnly ? "" : "lumin-product-page__btn-wishlist",
    fav
      ? iconOnly
        ? "lumin-icon-action-btn--wishlist-active"
        : "lumin-product-page__btn-wishlist--active"
      : "btn-outline-secondary",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={base}
      aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={fav}
      title={fav ? "Remove from wishlist" : "Add to wishlist"}
    >
      <span className={iconOnly ? "lumin-icon-action-btn__inner" : undefined}>
        <i
          className={
            iconOnly
              ? "lastudioicon-heart-2"
              : "lastudioicon-heart-2 lumin-product-page__btn-wishlist-icon"
          }
          aria-hidden="true"
        />
      </span>
      {!iconOnly ? (loading ? "…" : fav ? "Saved" : "Wishlist") : loading ? (
        <span className="visually-hidden">Updating wishlist</span>
      ) : null}
    </button>
  );
}

