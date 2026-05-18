"use client";

import { useEffect, useState } from "react";
import { getProductReviewsById } from "@/lib/shopenup/reviews";

export function useProductRating(productId: string | undefined) {
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(productId));

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await getProductReviewsById({ productId, limit: 1, offset: 0 });
        if (!cancelled) {
          setRating(res.average_rating || 0);
          setReviewCount(res.count || 0);
        }
      } catch {
        if (!cancelled) {
          setRating(0);
          setReviewCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return { rating, reviewCount, loading };
}
