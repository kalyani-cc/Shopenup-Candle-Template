"use client";

import { useEffect, useState } from "react";
import { StarRating } from "@/components/product-reviews/star-rating";
import { addProductReview, getProductReviewsById, updateProductReview } from "@/lib/shopenup/reviews";
import { luminToast } from "@/lib/toast";
import type { StoreProductReview } from "@/lib/types/product-review";

type OrderProductReviewProps = {
  productId: string;
  productTitle: string;
  productThumbnail?: string;
  customerId?: string;
  customerName?: { firstName: string; lastName: string };
  onReviewSubmitted?: () => void;
};

export function OrderProductReview({
  productId,
  productTitle,
  productThumbnail,
  customerId,
  customerName,
  onReviewSubmitted,
}: OrderProductReviewProps) {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [existingReview, setExistingReview] = useState<StoreProductReview | null>(null);

  const findMyReview = (reviews: StoreProductReview[], reviewId?: string) =>
    reviews.find(
      (r) =>
        r.product_id === productId &&
        (reviewId
          ? r.id === reviewId
          : Boolean(customerId && r.customer_id && r.customer_id === customerId))
    );

  const mergeReviewPreferFilled = (
    fromServer: StoreProductReview,
    fallback?: StoreProductReview | null
  ): StoreProductReview => ({
    ...fromServer,
    rating: fromServer.rating > 0 ? fromServer.rating : fallback?.rating ?? 0,
    content: fromServer.content.trim() || fallback?.content || "",
    title: fromServer.title || fallback?.title,
  });

  const syncExistingReview = async (
    reviewId?: string,
    fallback?: StoreProductReview | null
  ) => {
    const res = await getProductReviewsById({ productId, limit: 50, offset: 0 });
    const mine = findMyReview(res.reviews, reviewId);
    if (mine) {
      const merged = mergeReviewPreferFilled(mine, fallback);
      setHasExisting(true);
      setExistingReview(merged);
      return merged;
    }
    return null;
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const res = await getProductReviewsById({ productId, limit: 50, offset: 0 });
      if (cancelled) return;
      const mine = findMyReview(res.reviews);
      if (mine) {
        setHasExisting(true);
        setExistingReview(mine);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, customerId]);

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setRating(0);
    setTitle("");
    setContent("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      luminToast("Please select a rating", "error");
      return;
    }
    if (content.trim().length < 10) {
      luminToast("Review must be at least 10 characters", "error");
      return;
    }

    setLoading(true);
    const firstName = customerName?.firstName || "Customer";
    const lastName = customerName?.lastName || "User";

    const submittedContent = content.trim();
    const submittedTitle = title.trim();

    const mergeWithSubmitted = (fromApi: StoreProductReview | null): StoreProductReview => {
      const base =
        fromApi ??
        ({
          id: "",
          product_id: productId,
          customer_id: customerId ?? null,
          first_name: firstName,
          last_name: lastName,
          rating: 0,
          content: "",
        } satisfies StoreProductReview);

      return {
        ...base,
        product_id: base.product_id || productId,
        customer_id: base.customer_id ?? customerId ?? null,
        rating: base.rating > 0 ? base.rating : rating,
        content: base.content.trim() || submittedContent,
        title: base.title || submittedTitle || undefined,
        first_name: base.first_name || firstName,
        last_name: base.last_name || lastName,
      };
    };

    try {
      let displayedReview: StoreProductReview;

      if (isEditing && existingReview?.id) {
        const updated = await updateProductReview({
          id: existingReview.id,
          rating,
          title: submittedTitle || undefined,
          content: submittedContent,
          first_name: firstName,
          last_name: lastName,
        });
        if (!updated) {
          luminToast("Failed to update review. Please try again.", "error");
          return;
        }
        displayedReview = mergeWithSubmitted(updated);
        luminToast("Review updated successfully!", "success");
      } else {
        const created = await addProductReview({
          product_id: productId,
          rating,
          title: submittedTitle || undefined,
          content: submittedContent,
          first_name: firstName,
          last_name: lastName,
        });
        if (!created) {
          luminToast("Failed to submit review. Please try again.", "error");
          return;
        }
        displayedReview = mergeWithSubmitted(created);
        luminToast("Review submitted successfully!", "success");
      }

      setExistingReview(displayedReview);
      setHasExisting(true);
      resetForm();
      await syncExistingReview(displayedReview.id, displayedReview);
      onReviewSubmitted?.();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    if (!existingReview) return;
    setIsEditing(true);
    setShowForm(true);
    setRating(existingReview.rating);
    setTitle(existingReview.title || "");
    setContent(existingReview.content);
  };

  if (hasExisting && !showForm) {
    return (
      <div className="lumin-order-review mt-3 p-3 rounded border bg-light">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <p className="mb-0 small fw-semibold text-success">Review submitted</p>
          {existingReview?.id ? (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={startEdit}>
              Edit review
            </button>
          ) : null}
        </div>
        {existingReview ? (
          <>
            <StarRating value={existingReview.rating} size="sm" className="mb-2" />
            {existingReview.title ? <p className="mb-1 fw-semibold small">{existingReview.title}</p> : null}
            <p className="mb-0 small text-secondary">{existingReview.content}</p>
          </>
        ) : (
          <p className="mb-0 small text-secondary">Thank you for your review.</p>
        )}
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="lumin-order-review mt-3 p-3 rounded border">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <p className="mb-0 small text-secondary">Share your experience with this product</p>
          <button type="button" className="btn btn-sm btn-dark" onClick={() => setShowForm(true)}>
            Write review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lumin-order-review mt-3 p-3 p-md-4 rounded border bg-white">
      <div className="d-flex align-items-start gap-3 mb-3">
        {productThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productThumbnail}
            alt=""
            width={56}
            height={56}
            className="rounded border object-fit-cover flex-shrink-0"
          />
        ) : null}
        <div>
          <p className="mb-0 fw-semibold small">{productTitle}</p>
          <p className="mb-0 text-secondary small">{isEditing ? "Edit your review" : "Write your review"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lumin-review-form">
        <div className="mb-3">
          <label className="form-label small fw-semibold">Rating *</label>
          <StarRating value={rating} interactive onChange={setRating} />
        </div>
        <div className="mb-3">
          <label htmlFor={`review-title-${productId}`} className="form-label small fw-semibold">
            Title (optional)
          </label>
          <input
            id={`review-title-${productId}`}
            type="text"
            className="form-control form-control-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your review"
          />
        </div>
        <div className="mb-3">
          <label htmlFor={`review-content-${productId}`} className="form-label small fw-semibold">
            Review *
          </label>
          <textarea
            id={`review-content-${productId}`}
            className="form-control form-control-sm"
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell us about your experience…"
          />
          <p className="form-text mb-0">Minimum 10 characters ({content.length}/10)</p>
        </div>
        <div className="d-flex flex-wrap gap-2 justify-content-end">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetForm} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-sm btn-dark"
            disabled={loading || !rating || content.trim().length < 10}
          >
            {loading ? "Saving…" : isEditing ? "Update review" : "Submit review"}
          </button>
        </div>
      </form>
    </div>
  );
}
