import type { HomeHighlightSectionMeta } from "@/lib/shopenup/product";
import type { Product } from "@/lib/store-data";
import { HomeProductCard } from "@/components/pages/home/home-product-card";

type HomeNewArrivalSectionProps = {
  products: Product[];
  section?: HomeHighlightSectionMeta;
};

export function HomeNewArrivalSection({ products, section }: HomeNewArrivalSectionProps) {
  const title = section?.title ?? "Featured collection";
  const viewHref = section
    ? `/products?collection=${encodeURIComponent(section.collectionHandle)}`
    : "/products";
  const slice = products.slice(0, 8);

  return (
    <div className="product-section section-padding">
      <div className="container-fluid home-container">
        <div className="section-title text-center js-scroll ShortFadeInUp scrolled">
          <h2 className="section-title__title">{title}</h2>
          <div className="section-title__shape">
            <img src="/assets/images/section-shape-1.svg" alt="" width={129} height={136} loading="lazy" />
          </div>
        </div>
        <div className="product-wrapper">
          <div className="row g-xxl-4">
            {slice.length === 0 ? (
              <div className="col-12">
                <p className="text-center text-muted py-5 mb-0">No products available yet.</p>
              </div>
            ) : (
              slice.map((p) => (
                <div key={p.id || p.slug} className="col-xl-3 col-md-4 col-sm-6">
                  <HomeProductCard product={p} />
                </div>
              ))
            )}
          </div>
        </div>
        <div className="text-center js-scroll ShortFadeInUp scrolled">
          <a className="view-more-btn" href={viewHref}>
            VIEW MORE PRODUCTS
          </a>
        </div>
      </div>
    </div>
  );
}
