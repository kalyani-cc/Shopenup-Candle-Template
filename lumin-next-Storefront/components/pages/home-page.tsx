import type { HomeHighlightSectionMeta } from "@/lib/shopenup/product";
import type { BlogPost, Product } from "@/lib/store-data";
import { HomeBestSellingSection } from "@/components/pages/home/home-best-selling-section";
import { HomeBlogSection } from "@/components/pages/home/home-blog-strip";
import { HomeBottomBanners } from "@/components/pages/home/home-bottom-banners";
import { HomeBrands } from "@/components/pages/home/home-brands";
import { HomeFeaturesMarquee } from "@/components/pages/home/home-features-marquee";
import { HomeHandpickBanners } from "@/components/pages/home/home-handpick-banners";
import { HomeHeroSlider } from "@/components/pages/home/home-hero-slider";
import { HomeInstagram } from "@/components/pages/home/home-instagram";
import { HomeNewArrivalSection } from "@/components/pages/home/home-new-arrival-section";
import { HomeOurInfo } from "@/components/pages/home/home-our-info";
import { HomeSpecialOffer } from "@/components/pages/home/home-special-offer";

export type LuminHomePageProps = {
  newArrivals: Product[];
  bestSelling: Product[];
  newArrivalSection?: HomeHighlightSectionMeta;
  bestSellingSection?: HomeHighlightSectionMeta;
  blogPosts: BlogPost[];
};

/** Full Lumin home layout (formerly `templates/lumin/index.html` main content), as React/TSX. */
export function LuminHomePage({
  newArrivals,
  bestSelling,
  newArrivalSection,
  bestSellingSection,
  blogPosts,
}: LuminHomePageProps) {
  return (
    <div className="lumin-home-page">
      <HomeHeroSlider />
      <HomeHandpickBanners />
      <HomeNewArrivalSection products={newArrivals} section={newArrivalSection} />
      <HomeFeaturesMarquee />
      <HomeSpecialOffer />
      <HomeBrands />
      <HomeBestSellingSection products={bestSelling} section={bestSellingSection} />
      <HomeBlogSection posts={blogPosts} />
      <HomeInstagram />
      <HomeOurInfo />
      <HomeBottomBanners />
    </div>
  );
}
