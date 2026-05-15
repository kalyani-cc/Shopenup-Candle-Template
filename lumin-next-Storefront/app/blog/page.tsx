import { getBlogPostsForPage } from "@/lib/blog-posts";
import { BLOG_POSTS_PER_PAGE } from "@/lib/blog-list-html";
import { getBlogListingMarkup } from "@/lib/lumin-page-markup";
import { renderTransformedLuminMarkup } from "@/lib/render-lumin-template";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams?: { page?: string };
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const allPosts = await getBlogPostsForPage();
  const raw = parseInt(String(searchParams?.page || "1"), 10);
  const requestedPage = Number.isFinite(raw) && raw >= 1 ? raw : 1;
  const totalPages = Math.max(1, Math.ceil(allPosts.length / BLOG_POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * BLOG_POSTS_PER_PAGE;
  const pagePosts = allPosts.slice(start, start + BLOG_POSTS_PER_PAGE);

  return renderTransformedLuminMarkup(
    await getBlogListingMarkup(pagePosts, currentPage, totalPages)
  );
}
