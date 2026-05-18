"use client";

import { useEffect, useState } from "react";
import { getProductReviewsById } from "@/lib/shopenup/reviews";
import type { StoreProductReview } from "@/lib/types/product-review";
import { StarRating } from "@/components/product-reviews/star-rating";

type ProductReviewsProps = {
  productId: string;
};

function formatReviewDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ReviewCard({ review }: { review: StoreProductReview }) {
  return (
    <article className="lumin-review-card card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <p className="mb-0 fw-semibold">
            {review.first_name} {review.last_name}
          </p>
          {review.created_at ? (
            <time className="text-secondary small" dateTime={review.created_at}>
              {formatReviewDate(review.created_at)}
            </time>
          ) : null}
        </div>
        <StarRating value={review.rating} size="sm" className="mb-2" />
        {review.title ? <h4 className="h6 mb-2">{review.title}</h4> : null}
        <p className="mb-0 text-secondary" style={{ lineHeight: 1.65 }}>
          {review.content}
        </p>
      </div>
    </article>
  );
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [reviews, setReviews] = useState<StoreProductReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [count, setCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getProductReviewsById({
      productId,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })
      .then((res) => {
        if (cancelled) return;
        setReviews((prev) => {
          const incoming = res.reviews.filter((r) => !prev.some((p) => p.id === r.id));
          return page === 1 ? res.reviews : [...prev, ...incoming];
        });
        setAverageRating(res.average_rating || 0);
        setCount(res.count || 0);
        setHasMore((res.count || 0) > pageSize * page);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId, page]);

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const starCount = reviews.filter((r) => Math.round(Number(r.rating)) === stars).length;
    const pct = reviews.length ? Math.round((starCount / reviews.length) * 100) : 0;
    return { stars, pct };
  });

  return (
    <div className="lumin-product-reviews">
      <div className="row g-4 mb-4 pb-4 border-bottom">
        <div className="col-md-5">
          <h3 className="h5 fw-semibold mb-3">Customer reviews</h3>
          <div className="d-flex align-items-center gap-3">
            <span className="display-6 fw-bold mb-0">{averageRating.toFixed(1)}</span>
            <div>
              <StarRating value={averageRating} className="mb-1" />
              <p className="mb-0 text-secondary small">
                {count} {count === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <h4 className="h6 fw-semibold mb-3">Rating breakdown</h4>
          {reviews.length > 0 ? (
            <ul className="list-unstyled mb-0 lumin-review-breakdown">
              {distribution.map(({ stars, pct }) => (
                <li key={stars} className="d-flex align-items-center gap-2 mb-2">
                  <span className="small text-nowrap" style={{ width: "2.5rem" }}>
                    {stars} ★
                  </span>
                  <div className="progress flex-grow-1" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-warning"
                      role="progressbar"
                      style={{ width: `${pct}%` }}
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <span className="small text-secondary text-end" style={{ width: "2.5rem" }}>
                    {pct}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-secondary small mb-0">No ratings yet.</p>
          )}
        </div>
      </div>

      {loading && page === 1 ? (
        <p className="text-secondary mb-0">Loading reviews…</p>
      ) : reviews.length > 0 ? (
        <div className="d-flex flex-column gap-3 mb-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-5 px-3 rounded bg-light mb-4">
          <p className="fw-semibold mb-1">No reviews yet</p>
          <p className="text-secondary small mb-0">Be the first to review this product after your purchase.</p>
        </div>
      )}

      {hasMore ? (
        <div className="text-center">
          <button
            type="button"
            className="btn btn-outline-dark"
            disabled={loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {loading ? "Loading…" : "Load more reviews"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
