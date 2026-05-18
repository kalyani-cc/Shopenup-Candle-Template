export type StoreProductReview = {
  id: string;
  title?: string | null;
  rating: number;
  content: string;
  first_name: string;
  last_name: string;
  product_id: string;
  customer_id?: string | null;
  status?: string;
  created_at?: string;
};

export type ProductReviewsResponse = {
  reviews: StoreProductReview[];
  average_rating: number;
  limit: number;
  offset: number;
  count: number;
};
