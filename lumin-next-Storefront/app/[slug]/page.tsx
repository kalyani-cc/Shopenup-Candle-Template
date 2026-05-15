import { notFound } from "next/navigation";
import { DEMO_TEMPLATE_SLUGS, getDemoTemplateMarkup } from "@/lib/lumin-page-markup";
import { renderTransformedLuminMarkup } from "@/lib/render-lumin-template";

type TemplatePageProps = {
  params: {
    slug: string;
  };
};

export default async function LegacyDemoTemplatePage({ params }: TemplatePageProps) {
  const slug = (params.slug || "").trim().toLowerCase();

  if (!DEMO_TEMPLATE_SLUGS.has(slug)) {
    notFound();
  }

  const markup = await getDemoTemplateMarkup(slug);
  if (!markup) {
    notFound();
  }

  return renderTransformedLuminMarkup(markup);
}
