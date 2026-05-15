import { LuminTemplateScripts } from "@/components/lumin-template-scripts";
import { LuminHomePage } from "@/components/pages/home-page";
import { getBlogPostsForPage } from "@/lib/blog-posts";
import { getHomeProductHighlights } from "@/lib/shopenup/product";

export default async function HomePage() {
  const [{ newArrivals, bestSelling, newArrivalSection, bestSellingSection }, blogPosts] =
    await Promise.all([getHomeProductHighlights(8), getBlogPostsForPage()]);

  return (
    <>
      <LuminHomePage
        newArrivals={newArrivals}
        bestSelling={bestSelling}
        newArrivalSection={newArrivalSection}
        bestSellingSection={bestSellingSection}
        blogPosts={blogPosts}
      />
      <LuminTemplateScripts />
    </>
  );
}
