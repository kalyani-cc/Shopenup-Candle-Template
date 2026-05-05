import { notFound } from "next/navigation";
import { renderLuminTemplate } from "@/lib/render-lumin-template";

const ALLOWED_TEMPLATE_SLUGS = new Set<string>([
  "blog-left-sidebar",
  "blog-right-sidebar",
  "blog-single",
  "coming-soon",
  "compare",
  "empty-cart",
  "faqs",
  "index-2",
  "our-team",
  "product-single",
  "product-single-affiliate",
  "product-single-carousel",
  "product-single-countdown",
  "product-single-variable",
  "shop-3-columns",
  "shop-4-columns",
  "shop-masonry",
  "shop-sidebar",
  "term-of-use"
]);

type TemplatePageProps = {
  params: {
    slug: string;
  };
};

export default async function TemplatePage({ params }: TemplatePageProps) {
  const slug = (params.slug || "").trim().toLowerCase();

  if (!ALLOWED_TEMPLATE_SLUGS.has(slug)) {
    notFound();
  }

  return renderLuminTemplate(`${slug}.html`);
}
