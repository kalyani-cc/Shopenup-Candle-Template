import { FavouritesClient } from "@/components/pages/favourites-client";

type WishlistPageProps = {
  searchParams?: {
    addVariant?: string;
    slug?: string;
    id?: string;
    name?: string;
    price?: string;
    image?: string;
    category?: string;
    categoryLabel?: string;
    description?: string;
  };
};

export default function WishlistPage({ searchParams }: WishlistPageProps) {
  const initialAdd =
    searchParams?.addVariant && searchParams?.name
      ? {
          variantId: searchParams.addVariant,
          slug: searchParams.slug || searchParams.id || searchParams.addVariant,
          id: searchParams.id || searchParams.slug || searchParams.addVariant,
          name: searchParams.name,
          price: Number(searchParams.price || 0),
          image: searchParams.image || undefined,
          category: searchParams.category || "uncategorized",
          categoryLabel: searchParams.categoryLabel || undefined,
          description: searchParams.description || "No description available."
        }
      : null;

  return <FavouritesClient initialAdd={initialAdd} />;
}
