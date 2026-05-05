"use client";

import { useState } from "react";
import { addToCart } from "@/lib/shopenup/cart";

type AddToCartButtonProps = {
  variantId?: string;
  className?: string;
  /** Icon only (no “Add to cart” label); use `aria-label` via title context. */
  iconOnly?: boolean;
};

export function AddToCartButton({ variantId, className, iconOnly }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onAdd = async () => {
    if (!variantId) {
      setMessage("Variant not available.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await addToCart(variantId, 1);
      setMessage("Added to cart");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setLoading(false);
    }
  };

  const btnClass = [
    className || "btn btn-dark",
    iconOnly ? "lumin-icon-action-btn" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <button
        type="button"
        onClick={onAdd}
        disabled={loading || !variantId}
        className={btnClass}
        aria-label={iconOnly ? "Add to cart" : undefined}
        title={iconOnly ? "Add to cart" : undefined}
      >
        {iconOnly ? (
          <span className="lumin-icon-action-btn__inner" aria-hidden="true">
            {loading ? (
              <span className="lumin-icon-action-btn__spinner" />
            ) : (
              <i className="lastudioicon-shopping-cart-3" />
            )}
          </span>
        ) : loading ? (
          "Adding..."
        ) : (
          "Add to cart"
        )}
      </button>
      {message && !iconOnly ? <div className="small mt-2 text-muted">{message}</div> : null}
      {message && iconOnly ? (
        <span className="visually-hidden" role="status">
          {message}
        </span>
      ) : null}
    </div>
  );
}

