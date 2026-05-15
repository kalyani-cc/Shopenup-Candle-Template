import { getProductsListingMarkup } from "@/lib/lumin-page-markup";
import { renderTransformedLuminMarkup } from "@/lib/render-lumin-template";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  return renderTransformedLuminMarkup(await getProductsListingMarkup(searchParams || {}));
}
