"use client";

import { useState } from "react";
import { ProductRatingRow } from "@/components/product-rating-display";
import { ProductReviews } from "@/components/product-reviews/product-reviews";
import { useProductRating } from "@/hooks/use-product-rating";

type ProductDetailReviewsProps = {
  productId: string;
  initialRating?: number;
  initialReviewCount?: number;
};

export function ProductDetailReviews({
  productId,
  initialRating,
  initialReviewCount,
}: ProductDetailReviewsProps) {
  const [activeTab, setActiveTab] = useState<"reviews">("reviews");
  const { rating, reviewCount } = useProductRating(productId);

  const displayRating = rating > 0 ? rating : initialRating;
  const displayCount = reviewCount > 0 ? reviewCount : initialReviewCount;

  return (
    <section className="lumin-product-reviews-section mt-5 pt-4 border-top" id="reviews">
      <ul className="nav nav-tabs lumin-product-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            type="button"
            role="tab"
            className={["nav-link", activeTab === "reviews" ? "active" : ""].filter(Boolean).join(" ")}
            aria-selected={activeTab === "reviews"}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
            {displayCount ? (
              <span className="badge text-bg-secondary ms-2">{displayCount}</span>
            ) : null}
          </button>
        </li>
      </ul>

      <div className="mb-4">
        <ProductRatingRow
          product={{ rating: displayRating, reviewCount: displayCount }}
          className="mb-0"
        />
      </div>

      {activeTab === "reviews" ? <ProductReviews productId={productId} /> : null}
    </section>
  );
}
