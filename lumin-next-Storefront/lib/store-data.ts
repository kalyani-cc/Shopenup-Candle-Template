/** Product shape returned by `lib/shopenup/product` (mapped from store API). */
export type Product = {
  slug: string;
  id?: string;
  variantId?: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  reviewCount?: number;
  /** ISO timestamp from store API when available (home sorting). */
  createdAt?: string;
  category: string;
  categoryLabel?: string;
  collection?: string;
  collectionLabel?: string;
  badge?: "new" | "sale";
  description: string;
  image?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  category: string;
  author: string;
  excerpt: string;
  /** Hero / card image (absolute or site-relative URL). */
  image?: string;
  /** Plain text or lightly stripped HTML for the single post view. */
  body?: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-style-candles",
    title: "How To Style Candles At Home",
    date: "",
    category: "Tips",
    author: "Lumin",
    excerpt: "Simple ideas to style candles in your living room and bedroom.",
  },
  {
    slug: "why-soy-wax-matters",
    title: "Why Soy Wax Matters",
    date: "",
    category: "Tips",
    author: "Lumin",
    excerpt: "Learn why soy candles are cleaner and better for daily use.",
  },
  {
    slug: "best-gift-candle-guide",
    title: "Best Gift Candle Guide",
    date: "",
    category: "Gift",
    author: "Lumin",
    excerpt: "Top candle picks for birthdays, festivals, and celebrations.",
  },
];
