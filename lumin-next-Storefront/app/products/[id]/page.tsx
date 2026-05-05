import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/ui/add-to-cart-button";
import { FavouriteToggleButton } from "@/components/ui/favourite-toggle-button";
import { StoreProductImage } from "@/components/store-product-image";
import { ProductRatingRow } from "@/components/product-rating-display";
import { RelatedProductsSection } from "@/components/product-related-grid";
import { getProductByHandle, getProductById, listRelatedProducts } from "@/lib/shopenup/product";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function ProductDetailPage({ params }: PageProps) {
  const segment = decodeURIComponent(params.id);
  const product = (await getProductById(segment)) || (await getProductByHandle(segment));
  if (!product) {
    notFound();
  }

  const related = await listRelatedProducts(product.id, product.slug, product.category, 8);

  const descIsHtml = product.description.includes("<");
  const relatedTitle =
    product.categoryLabel && product.categoryLabel !== "Uncategorized"
      ? `More in ${product.categoryLabel}`
      : "You may also like";

      return (
        <section className="lumin-product-page py-5">
          <div className="container-fluid custom-container">
      
            {/* Breadcrumb */}
            <nav className="mb-4 text-muted small">
              <Link href="/products" className="text-decoration-none">Products</Link>
              <span className="mx-2">/</span>
              <span className="fw-medium text-dark">{product.name}</span>
            </nav>
      
            <div className="row g-4 g-lg-5 align-items-start">
              {/* Product Image — narrow column + max width so photo does not dominate */}
              <div className="col-12 col-lg-4 col-xl-3">
                <div className="lumin-product-detail__image-card mx-auto mx-lg-0">
                  <div className="ratio ratio-1x1 overflow-hidden rounded-3 bg-light">
                    <StoreProductImage src={product.image} alt={product.name} />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="col-12 col-lg-8 col-xl-9">
                <div className="product-info">
      
                  <h1 className="fw-bold mb-2">{product.name}</h1>
                  <ProductRatingRow product={product} className="mb-3" />

                  {/* Price */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="fs-3 fw-semibold text-dark">
                      {formatCurrency(product.price)}
                    </span>
      
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className="text-muted text-decoration-line-through fs-5">
                        {formatCurrency(product.oldPrice)}
                      </span>
                    )}
                  </div>
      
                  {/* Description */}
                  <div className="text-muted mb-4" style={{ lineHeight: "1.7" }}>
                    {descIsHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                      <p>{product.description}</p>
                    )}
                  </div>
      
                  {/* Actions — icon-only toolbar */}
                  <div className="lumin-product-detail__icon-actions d-flex flex-wrap align-items-center gap-2">
                    <AddToCartButton
                      variantId={product.variantId}
                      iconOnly
                      className="btn btn-dark rounded-3"
                    />
                    <FavouriteToggleButton product={product} iconOnly />
                    <Link
                      href="/products"
                      className="btn btn-outline-secondary rounded-3 lumin-icon-action-btn"
                      aria-label="Back to products"
                      title="Back to products"
                    >
                      <span className="lumin-icon-action-btn__inner" aria-hidden="true">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M15 6l-6 6 6 6" />
                        </svg>
                      </span>
                    </Link>
                  </div>
      
                </div>
              </div>
      
            </div>
          </div>
      
          {/* Related */}
          <div className="mt-5 pt-4 border-top">
            <RelatedProductsSection title={relatedTitle} products={related} />
          </div>
        </section>
      );
}
