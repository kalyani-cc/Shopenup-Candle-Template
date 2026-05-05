import type { Product } from "@/lib/store-data";

type ProductRatingRowProps = {
  product: Pick<Product, "rating" | "reviewCount">;
  /** Tighter spacing for cards */
  compact?: boolean;
  className?: string;
};

export function ProductRatingRow({ product, compact, className }: ProductRatingRowProps) {
  const r = Number(product.rating);
  const c = Number(product.reviewCount);
  const hasRating = Number.isFinite(r) && r > 0;
  const hasReviews = Number.isFinite(c) && c > 0;
  if (!hasRating && !hasReviews) {
    return null;
  }

  const rounded = Math.min(5, Math.max(0, Math.round(r)));
  const label = hasRating ? (Math.round(r * 10) / 10).toFixed(1) : "";
  const aria = hasRating
    ? `Rated ${label} out of 5 stars${hasReviews ? `, ${c} reviews` : ""}`
    : `${c} ${c === 1 ? "review" : "reviews"}`;

  return (
    <div
      className={["lumin-product-rating", compact ? "lumin-product-rating--compact" : "", className || ""]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={aria}
    >
      {hasRating ? (
        <span className="lumin-rating-stars" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={i <= rounded ? "lumin-rating-stars__star is-on" : "lumin-rating-stars__star"}
            >
              ★
            </span>
          ))}
        </span>
      ) : null}
      <span className="lumin-rating-stars__meta text-muted">
        {hasRating ? `${label}` : null}
        {hasRating && hasReviews ? " · " : null}
        {hasReviews ? `${c} ${c === 1 ? "review" : "reviews"}` : null}
      </span>
    </div>
  );
}
