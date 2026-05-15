import type { BlogPost } from "@/lib/store-data";

/** Posts per listing page (`/blog`, `/blog?page=2`, …). */
export const BLOG_POSTS_PER_PAGE = 5;

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DEFAULT_IMG = "/assets/images/blog/blog-1.jpg";

function normalizeImgSrc(src: string): string {
  const t = src.trim();
  if (!t) return DEFAULT_IMG;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) {
    return escapeHtml(t);
  }
  return escapeHtml(`/${t.replace(/^\.?\//, "")}`);
}

/** Hero title from the static Lumin template. */
export function injectBlogListingHero(markup: string): string {
  return markup.replace(
    /(<h2 class="breadcrumb-wrapper__title">\s*)Blog No Sidebar(\s*<\/h2>)/i,
    "$1Our Blog$2"
  );
}

/** One row: image + content; images constrained via `.lumin-blog-items` in `globals.css`. */
export function buildBlogListingItemHtml(post: BlogPost): string {
  const href = `/blog/${encodeURIComponent(post.slug)}`;
  const title = escapeHtml(post.title);
  const date = escapeHtml(post.date || "—");
  const author = escapeHtml(post.author || "Editor");
  const excerpt = escapeHtml(post.excerpt);
  const img = normalizeImgSrc(post.image || DEFAULT_IMG);
  const cat = escapeHtml(post.category);

  return `
                    <!-- Blog Item Start -->
                    <article class="blog-item-2 lumin-blog-card">
                        <div class="blog-item-2__image lumin-blog-card__media">
                            <a href="${href}" class="lumin-blog-card__media-link">
                                <img class="lumin-blog-card__img" src="${img}" alt="${title}" width="640" height="400" loading="lazy" decoding="async" sizes="(min-width: 992px) 38vw, 100vw" />
                            </a>
                        </div>
                        <div class="blog-item-2__content lumin-blog-card__body">
                            <ul class="blog-item-2__content--meta">
                                <li><span>${date}</span></li>
                                <li>
                                    <span>By <a href="/blog">${author}</a><span class="lumin-blog-card__sep"> · </span>${cat}</span>
                                </li>
                            </ul>
                            <h4 class="blog-item-2__content--title">
                                <a href="${href}">${title}</a>
                            </h4>
                            <p class="blog-item-2__content--description">${excerpt}</p>
                            <a class="blog-item-2__content--btn btn" href="${href}">Read more</a>
                        </div>
                    </article>
                    <!-- Blog Item End -->`;
}

export function buildBlogListingItemsHtml(posts: BlogPost[]): string {
  if (!posts.length) {
    return `
                    <article class="blog-item-2 lumin-blog-card lumin-blog-card--empty">
                        <div class="blog-item-2__content">
                            <p class="blog-item-2__content--description mb-0">No posts yet. Blog data is fetched on the <strong>server</strong> (you will not see a request to the API host in the browser Network tab). Open <a href="/api/store-blog">/api/store-blog</a> to verify the connection, ensure articles are <strong>published</strong> (not draft) in admin, and check the Next.js terminal for <code>[blog-posts]</code> warnings.</p>
                        </div>
                    </article>`;
  }
  return posts.map(buildBlogListingItemHtml).join("\n");
}

/** Replace static cards between template markers with dynamic HTML. */
export function injectBlogListingItems(markup: string, posts: BlogPost[]): string {
  const inner = buildBlogListingItemsHtml(posts);
  return markup.replace(
    /<!-- Blog Items Start -->[\s\S]*?<!-- Blog Items End -->/,
    `<!-- Blog Items Start -->
                <div class="blog-items lumin-blog-items">
${inner}
                </div>
                <!-- Blog Items End -->`
  );
}

function blogListUrl(page: number): string {
  if (page <= 1) {
    return "/blog";
  }
  return `/blog?page=${page}`;
}

/** Which page numbers to show (sorted), for inserting ellipses between gaps. */
function pageNumbersToShow(current: number, total: number): number[] {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= total) {
      set.add(p);
    }
  }
  return [...set].sort((a, b) => a - b);
}

export function buildBlogPaginationHtml(currentPage: number, totalPages: number): string {
  if (totalPages <= 1) {
    return `<!-- Pagination Start -->
                <div class="paginations lumin-blog-pagination lumin-blog-pagination--single" aria-label="Blog pagination"></div>
                <!-- Pagination End -->`;
  }

  const pages = pageNumbersToShow(currentPage, totalPages);
  const items: string[] = [];

  if (currentPage > 1) {
    items.push(`
                        <li>
                            <a href="${escapeHtml(blogListUrl(currentPage - 1))}" aria-label="Previous page">
                                <i class="lastudioicon-arrow-left"></i>
                            </a>
                        </li>`);
  } else {
    items.push(`
                        <li>
                            <span class="lumin-blog-page-nav lumin-blog-page-nav--disabled" aria-disabled="true" aria-label="Previous page">
                                <i class="lastudioicon-arrow-left"></i>
                            </span>
                        </li>`);
  }

  let prevNum = 0;
  for (const p of pages) {
    if (prevNum && p - prevNum > 1) {
      items.push(`
                        <li><span class="lumin-blog-page-ellipsis">…</span></li>`);
    }
    const active = p === currentPage ? ` class="active"` : "";
    items.push(`
                        <li>
                            <a${active} href="${escapeHtml(blogListUrl(p))}">${p}</a>
                        </li>`);
    prevNum = p;
  }

  if (currentPage < totalPages) {
    items.push(`
                        <li>
                            <a href="${escapeHtml(blogListUrl(currentPage + 1))}" aria-label="Next page">
                                <i class="lastudioicon-arrow-right"></i>
                            </a>
                        </li>`);
  } else {
    items.push(`
                        <li>
                            <span class="lumin-blog-page-nav lumin-blog-page-nav--disabled" aria-disabled="true" aria-label="Next page">
                                <i class="lastudioicon-arrow-right"></i>
                            </span>
                        </li>`);
  }

  return `<!-- Pagination Start -->
                <div class="paginations lumin-blog-pagination" aria-label="Blog pagination">
                    <ul class="paginations-list-2">
                        ${items.join("")}
                    </ul>
                </div>
                <!-- Pagination End -->`;
}

export function injectBlogPagination(markup: string, currentPage: number, totalPages: number): string {
  return markup.replace(
    /<!-- Pagination Start -->[\s\S]*?<!-- Pagination End -->/,
    buildBlogPaginationHtml(currentPage, totalPages)
  );
}
