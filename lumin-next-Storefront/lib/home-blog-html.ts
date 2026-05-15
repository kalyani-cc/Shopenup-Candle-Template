import type { BlogPost } from "@/lib/store-data";

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeImg(src: string | undefined): string {
  const t = (src || "").trim();
  if (!t) return "/assets/images/blog/home-1/blog-1.jpg";
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) {
    return escapeHtml(t);
  }
  return escapeHtml(`/${t.replace(/^\.?\//, "")}`);
}

/** Two-column blog strip matching `templates/lumin/index.html` `blog-item` cards. */
export function buildHomeBlogRowHtml(posts: BlogPost[], limit = 2): string {
  const slice = posts.slice(0, limit);
  if (!slice.length) {
    return `
                    <div class="row">
                        <div class="col-12">
                            <p class="text-center text-muted py-4 mb-0">No blog posts yet. Publish articles in admin or configure an alternate blog JSON source in env.</p>
                        </div>
                    </div>`;
  }

  const colClass = slice.length === 1 ? "col-lg-8 mx-auto" : "col-lg-6";

  const cols = slice.map((post) => {
    const href = `/blog/${encodeURIComponent(post.slug)}`;
    const title = escapeHtml(post.title);
    const date = escapeHtml(post.date || "—");
    const author = escapeHtml(post.author || "Editor");
    const img = normalizeImg(post.image);

    return `
                        <div class="${colClass}">
                            <!-- Blog item Start -->
                            <div class="blog-item js-scroll ShortFadeInUp scrolled">
                                <div class="blog-item__image">
                                    <a href="${href}">
                                        <img src="${img}" alt="${title}" width="808" height="474" loading="lazy" decoding="async" />
                                    </a>
                                </div>
                                <div class="blog-item__content">
                                    <div class="blog-item__inner">
                                        <h3 class="blog-item__title">
                                            <a href="${href}">${title}</a>
                                        </h3>
                                        <ul class="blog-item__meta">
                                            <li><span>${date}</span></li>
                                            <li>
                                                <span>By <a href="/blog">${author}</a></span>
                                            </li>
                                        </ul>
                                        <div class="blog-item__btn-wrap">
                                            <a class="blog-item__btn" href="${href}">Read more</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Blog item End -->
                        </div>`;
  });

  return `
                    <div class="row">
                        ${cols.join("")}
                    </div>`;
}

/** Replace static home “Blog & Insights” grid with API/static blog data; link “VIEW MORE BLOG” to /blog. */
export function injectHomeBlogSection(markup: string, posts: BlogPost[]): string {
  const inner = buildHomeBlogRowHtml(posts, 2);
  let next = markup.replace(
    /<!-- Blog Wrapper Start -->[\s\S]*?<!-- Blog Wrapper End -->/,
    `<!-- Blog Wrapper Start -->
                <div class="blog-wrapper lumin-home-blog">
${inner}
                </div>
                <!-- Blog Wrapper End -->`
  );
  next = next.replace(
    /<a class="view-more-btn view-more-btn-2" href="#">/,
    `<a class="view-more-btn view-more-btn-2" href="/blog">`
  );
  return next;
}
