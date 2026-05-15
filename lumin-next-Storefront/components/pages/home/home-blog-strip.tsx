import Link from "next/link";
import type { BlogPost } from "@/lib/store-data";

function normalizeImg(src: string | undefined): string {
  const t = (src || "").trim();
  if (!t) return "/assets/images/blog/home-1/blog-1.jpg";
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) return t;
  return `/${t.replace(/^\.?\//, "")}`;
}

type HomeBlogStripProps = {
  posts: BlogPost[];
  limit?: number;
};

export function HomeBlogStrip({ posts, limit = 2 }: HomeBlogStripProps) {
  const slice = posts.slice(0, limit);

  if (slice.length === 0) {
    return (
      <div className="row">
        <div className="col-12">
          <p className="text-center text-muted py-4 mb-0">
            No blog posts yet. Publish articles in admin or configure an alternate blog JSON source in env.
          </p>
        </div>
      </div>
    );
  }

  const colClass = slice.length === 1 ? "col-lg-8 mx-auto" : "col-lg-6";

  return (
    <div className="row">
      {slice.map((post, idx) => {
        const href = `/blog/${encodeURIComponent(post.slug)}`;
        const img = normalizeImg(post.image);
        const date = post.date || "—";
        const author = post.author || "Editor";
        return (
          <div key={post.slug || idx} className={colClass}>
            <div className="blog-item js-scroll ShortFadeInUp scrolled">
              <div className="blog-item__image">
                <Link href={href}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={post.title} width={808} height={474} loading="lazy" decoding="async" />
                </Link>
              </div>
              <div className="blog-item__content">
                <div className="blog-item__inner">
                  <h3 className="blog-item__title">
                    <Link href={href}>{post.title}</Link>
                  </h3>
                  <ul className="blog-item__meta">
                    <li>
                      <span>{date}</span>
                    </li>
                    <li>
                      <span>
                        By <Link href="/blog">{author}</Link>
                      </span>
                    </li>
                  </ul>
                  <div className="blog-item__btn-wrap">
                    <Link className="blog-item__btn" href={href}>
                      Read more
                    </Link>
                  </div>
                </div>
              </div>
              {slice.length === 2 && idx === 1 ? (
                <div className="blog-item__play">
                  <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                      fill="currentColor"
                      d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
                    />
                  </svg>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HomeBlogSection({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="blog-section section-padding">
      <div className="container-fluid home-container">
        <div className="section-title text-center js-scroll ShortFadeInUp scrolled">
          <h2 className="section-title__title">Blog & Insights</h2>
          <div className="section-title__shape">
            <img src="/assets/images/section-shape-1.svg" alt="" width={129} height={136} loading="lazy" />
          </div>
        </div>
        <div className="blog-wrapper lumin-home-blog">
          <HomeBlogStrip posts={posts} />
        </div>
        <div className="text-center js-scroll ShortFadeInUp scrolled">
          <Link className="view-more-btn view-more-btn-2" href="/blog">
            VIEW MORE BLOG
          </Link>
        </div>
      </div>
    </div>
  );
}
