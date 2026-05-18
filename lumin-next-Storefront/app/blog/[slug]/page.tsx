import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostDescription } from "@/components/blog/blog-post-description";
import { getBlogPostBySlug } from "@/lib/blog-posts";

function safeImageUrl(raw: string | undefined): string {
  const t = (raw || "").trim();
  if (!t) return "/assets/images/blog/blog-5.jpg";
  if (t.startsWith("/")) return t;
  if (t.startsWith("https://") || t.startsWith("http://")) return t;
  if (t.startsWith(".")) return `/${t.replace(/^\.+\//, "")}`;
  return "/assets/images/blog/blog-5.jpg";
}

type PageProps = {
  params: { slug: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) {
    return { title: "Blog" };
  }
  return { title: `${post.title} — Blog` };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  const text = (post.body || post.excerpt || "").trim();
  const paragraphs = text
    ? text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [post.excerpt];
  const img = safeImageUrl(post.image);

  return (
    <div className="lumin-blog-post-page blog-section-02 section-padding-1">
      <div className="container-fluid blog-single-container">
        <nav className="lumin-blog-post-breadcrumb-nav mb-4" aria-label="Breadcrumb">
          <ol className="lumin-blog-post-breadcrumb breadcrumb mb-0 justify-content-center flex-wrap">
            <li className="breadcrumb-item">
              <Link href="/">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/blog">Blog</Link>
            </li>
            <li className="breadcrumb-item active text-truncate" style={{ maxWidth: "min(100%, 28rem)" }} aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        <article className="blog-single lumin-blog-post-article">
          <div className="row align-items-start lumin-blog-post-media-row blog-single-wrapper gx-md-4 gy-4">
            <div className="col-12 col-md-5 col-lg-5">
              <div className="blog-single__image lumin-blog-post-hero mb-0">
                <img
                  className="lumin-blog-post-hero__img"
                  src={img}
                  alt={post.title}
                  width={560}
                  height={420}
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
            <div className="col-12 col-md-7 col-lg-7">
              <header className="lumin-blog-post-header mb-3">
                <ul className="blog-single__category justify-content-start mb-2">
                  <li>
                    <Link href="/blog">{post.category}</Link>
                  </li>
                </ul>
                <h1 className="blog-single__title text-start mb-3">{post.title}</h1>
                <ul className="blog-single__meta justify-content-start mb-0">
                  <li>
                    <span>{post.date || "—"}</span>
                  </li>
                  {post.author ? (
                    <li>
                      <span>By {post.author}</span>
                    </li>
                  ) : null}
                </ul>
              </header>
              <BlogPostDescription paragraphs={paragraphs} />
              <p className="text-start mt-4 mb-0">
                <Link href="/blog" className="btn btn-outline-dark">
                  ← All posts
                </Link>
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
