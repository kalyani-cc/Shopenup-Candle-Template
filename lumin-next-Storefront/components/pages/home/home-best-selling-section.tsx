import type { HomeHighlightSectionMeta } from "@/lib/shopenup/product";
import type { Product } from "@/lib/store-data";
import { HomeProductCard } from "@/components/pages/home/home-product-card";

type HomeBestSellingSectionProps = {
  products: Product[];
  section?: HomeHighlightSectionMeta;
};

export function HomeBestSellingSection({ products, section }: HomeBestSellingSectionProps) {
  const title = section?.title ?? "Featured collection";
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
        <div className="product-wrapper product-active navigation-arrows-style-2">
          {slice.length === 0 ? (
            <div className="swiper">
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <p className="text-center text-muted py-5 px-3 mb-0">No products available yet.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="swiper">
              <div className="swiper-wrapper">
                {slice.map((p) => (
                  <div key={p.id || p.slug} className="swiper-slide">
                    <HomeProductCard
                      product={p}
                      rootClassName="single-product js-scroll ShortFadeInUp scrolled"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="product-arrow js-scroll ShortFadeInUp scrolled">
            <div className="swiper-button-prev">
              <svg xmlns="http://www.w3.org/2000/svg" width="12.624" height="30.79" viewBox="0 0 12.624 30.79">
                <path
                  d="m11.229 1.395-10 14 10 14"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="square"
                  strokeMiterlimit="10"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="swiper-button-next">
              <svg xmlns="http://www.w3.org/2000/svg" width="12.624" height="30.79" viewBox="0 0 12.624 30.79">
                <path
                  d="m1.395 1.395 10 14-10 14"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="square"
                  strokeMiterlimit="10"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
