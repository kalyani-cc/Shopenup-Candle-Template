"use client";

import { useEffect } from "react";
import { addToCart } from "@/lib/shopenup/cart";
import { addToWishlist, isFavourite, listWishlistProducts, removeFromWishlist } from "@/lib/shopenup/wishlist";

const WISHLIST_HEART_ACTIVE_CLASS = "lumin-wishlist-heart--active";

async function syncWishlistHeartButtons(): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    const items = await listWishlistProducts();
    const ids = new Set(
      items.map((p) => p.variantId).filter((id): id is string => Boolean(id))
    );
    document.querySelectorAll(".js-quick-add-wishlist").forEach((el) => {
      const btn = el as HTMLElement;
      const id = btn.getAttribute("data-variant-id") || "";
      btn.classList.toggle(WISHLIST_HEART_ACTIVE_CLASS, Boolean(id && ids.has(id)));
    });
  } catch {
    document.querySelectorAll(".js-quick-add-wishlist").forEach((el) => {
      (el as HTMLElement).classList.remove(WISHLIST_HEART_ACTIVE_CLASS);
    });
  }
}

function emitToast(message: string, type: "success" | "info" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("lumin_next:toast", { detail: { message, type } }));
}

export function QuickAddHandlers() {
  useEffect(() => {
    void syncWishlistHeartButtons();
    const onWishlistChanged = () => {
      void syncWishlistHeartButtons();
    };
    window.addEventListener("lumin_next:wishlist_changed", onWishlistChanged);

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const cartBtn = target.closest(".js-quick-add-cart") as HTMLElement | null;
      if (cartBtn) {
        event.preventDefault();
        const variantId = cartBtn.getAttribute("data-variant-id") || "";
        if (!variantId) {
          emitToast("Variant not available for cart.", "error");
          return;
        }
        if (cartBtn.dataset.loading === "1") return;
        cartBtn.dataset.loading = "1";
        try {
          await addToCart(variantId, 1);
        } catch (e) {
          emitToast(e instanceof Error ? e.message : "Failed to add to cart.", "error");
        } finally {
          delete cartBtn.dataset.loading;
        }
        return;
      }

      const wishlistBtn = target.closest(".js-quick-add-wishlist") as HTMLElement | null;
      if (!wishlistBtn) return;

      event.preventDefault();
      const variantId = wishlistBtn.getAttribute("data-variant-id") || "";
      if (!variantId) {
        emitToast("Variant not available for wishlist.", "error");
        return;
      }
      if (wishlistBtn.dataset.loading === "1") return;

      wishlistBtn.dataset.loading = "1";
      try {
        const productPayload = {
          variantId,
          slug: wishlistBtn.getAttribute("data-slug") || variantId,
          id: wishlistBtn.getAttribute("data-id") || variantId,
          name: wishlistBtn.getAttribute("data-name") || "Untitled Product",
          price: Number(wishlistBtn.getAttribute("data-price") || 0),
          image: wishlistBtn.getAttribute("data-image") || undefined,
          category: wishlistBtn.getAttribute("data-category") || "uncategorized",
          categoryLabel: wishlistBtn.getAttribute("data-category-label") || undefined,
          description: wishlistBtn.getAttribute("data-description") || "No description available."
        };
        const already = await isFavourite(variantId);
        if (already) {
          await removeFromWishlist(variantId);
        } else {
          await addToWishlist(productPayload);
        }
        await syncWishlistHeartButtons();
      } catch (e) {
        emitToast(e instanceof Error ? e.message : "Failed to update wishlist.", "error");
      } finally {
        delete wishlistBtn.dataset.loading;
      }
    };

    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("lumin_next:wishlist_changed", onWishlistChanged);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
