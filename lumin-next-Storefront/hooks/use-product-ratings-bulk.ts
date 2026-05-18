"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductRatingsBulk } from "@/lib/shopenup/reviews";

type ProductRating = { rating: number; reviewCount: number };

export function useProductRatingsBulk(productIds: string[]) {
  const [ratings, setRatings] = useState<Record<string, ProductRating>>({});
  const [loading, setLoading] = useState(false);

  const idKey = useMemo(
    () => [...new Set(productIds.filter(Boolean))].sort().join(","),
    [productIds]
  );

  useEffect(() => {
    const ids = idKey ? idKey.split(",") : [];
    if (!ids.length) {
      setRatings({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    getProductRatingsBulk(ids)
      .then((data) => {
        if (!cancelled) {
          setRatings(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [idKey]);

  return { ratings, loading };
}
