import Link from "next/link";
import { ProductRatingRow } from "@/components/product-rating-display";
import { StoreProductImage } from "@/components/store-product-image";
import type { Product } from "@/lib/store-data";
import { formatCurrency } from "@/lib/utils";

type RelatedProductsSectionProps = {
  title: string;
  products: Product[];
};

export function RelatedProductsSection({ title, products }: RelatedProductsSectionProps) {
  if (!products.length) {
    return null;
  }

  return (
    <div className="lumin-related-products">
      <div className="container-fluid custom-container pb-5">
        <h2 className="lumin-related-products__heading">{title}</h2>
        <div className="row g-3 g-md-4 row-cols-2 row-cols-md-3 row-cols-lg-4">
          {products.map((p) => {
            const href = `/products/${encodeURIComponent(p.slug || p.id || "")}`;
            return (
              <div key={p.id || p.slug} className="col">
                <Link
                  href={href}
                  className="lumin-related-products__card d-block h-100 text-decoration-none text-reset rounded overflow-hidden"
                >
                  <div className="lumin-related-products__thumb ratio ratio-1x1 position-relative bg-light">
                    <StoreProductImage src={p.image} alt={p.name} />
                  </div>
                  <div className="lumin-related-products__meta">
                    <h3 className="lumin-related-products__name">{p.name}</h3>
                    <ProductRatingRow product={p} compact className="lumin-related-products__rating mb-1" />
                    <p className="lumin-related-products__price mb-0">{formatCurrency(p.price)}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
