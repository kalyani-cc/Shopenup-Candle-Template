import { isExplicitShopenupBackendUrlSet, SHOPENUP_BACKEND_URL } from "@/lib/config";
import { blogService } from "@/lib/shopenup/blog-service";
import { blogPosts, type BlogPost } from "@/lib/store-data";

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return "";
}

function slugifyFromTitle(title: string): string {
  const s = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "post";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function formatBlogDate(value: string): string {
  const t = value.trim();
  if (!t) return "";
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  return t;
}

/** Resolve relative backend uploads (`/static/...`) to absolute URLs for `<img src>`. */
function absolutizeBlogMediaUrl(path: string): string {
  const t = path.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("//")) {
    return t;
  }
  const base = SHOPENUP_BACKEND_URL.replace(/\/$/, "");
  if (!base) {
    return t.startsWith("/") ? t : `/${t.replace(/^\.?\//, "")}`;
  }
  const rel = t.startsWith("/") ? t : `/${t}`;
  return `${base}${rel}`;
}

/** Plain text from TipTap / ProseMirror JSON (`body` on Shopenup blog articles). */
function extractPlainTextFromRichBody(input: unknown): string {
  if (input == null) {
    return "";
  }
  if (typeof input === "string") {
    return stripHtml(input);
  }
  if (typeof input !== "object") {
    return "";
  }
  const o = input as Record<string, unknown>;
  if (typeof o.text === "string") {
    return o.text;
  }
  const parts: string[] = [];
  const content = o.content;
  if (Array.isArray(content)) {
    for (const c of content) {
      parts.push(extractPlainTextFromRichBody(c));
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function pickCategory(o: Record<string, unknown>): string {
  const direct = pickStr(o, ["category", "tag", "section", "post_category", "type"]);
  if (direct) {
    return direct;
  }
  const tags = o.tags;
  if (Array.isArray(tags) && tags.length > 0 && typeof tags[0] === "string") {
    return tags[0];
  }
  return "General";
}

/**
 * Coerce one JSON object into `BlogPost` (accepts common CMS / API field names).
 */
export function normalizeBlogRow(raw: unknown): BlogPost | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;

  let title = pickStr(o, ["title", "name", "headline", "subject", "post_title"]);
  if (!title) {
    const tr = o.title ?? o.name;
    if (tr != null && typeof tr !== "object") {
      title = String(tr).trim();
    }
  }
  if (!title) {
    return null;
  }

  let slug = pickStr(o, ["slug", "handle", "permalink", "post_name", "url_slug"]);
  if (!slug) {
    const id = pickStr(o, ["id", "uuid", "_id"]);
    slug = id ? String(id).replace(/\s+/g, "-").toLowerCase() : slugifyFromTitle(title);
  }

  let date =
    pickStr(o, ["date", "published_at", "publishedAt", "created_at", "createdAt", "post_date"]) || "";
  date = formatBlogDate(date);

  const category = pickCategory(o);
  const author = pickStr(o, ["author", "byline", "writer", "post_author", "author_name"]) || "";
  let image = pickStr(o, ["image", "thumbnail", "cover", "featured_image", "featuredImage", "hero_image", "img", "thumbnail_image"]);
  if (image) {
    image = absolutizeBlogMediaUrl(image);
  }

  let rawBody = pickStr(o, ["body", "content", "html", "markdown", "post_content", "description_long"]);
  if (!rawBody && o.body != null && typeof o.body !== "string") {
    rawBody = extractPlainTextFromRichBody(o.body);
  }
  const body = rawBody ? stripHtml(rawBody) : "";
  const excerptRaw = pickStr(o, [
    "excerpt",
    "summary",
    "description",
    "subtitle",
    "deck",
    "intro",
    "post_excerpt",
    "seo_description",
  ]);
  const excerpt =
    excerptRaw ||
    (body ? truncate(body, 280) : truncate(title, 120));

  return {
    slug,
    title,
    date,
    category,
    author,
    excerpt,
    ...(image ? { image } : {}),
    ...(body ? { body } : {}),
  };
}

/** Pull an array of post-like objects from typical API envelope shapes. */
export function parseBlogPostsPayload(body: unknown): BlogPost[] {
  if (Array.isArray(body)) {
    return body.map(normalizeBlogRow).filter((x): x is BlogPost => Boolean(x));
  }
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const candidates = [b.posts, b.data, b.articles, b.items, b.results, b.blog, b.records, b.rows];
    for (const c of candidates) {
      if (Array.isArray(c)) {
        return c.map(normalizeBlogRow).filter((x): x is BlogPost => Boolean(x));
      }
    }
  }
  return [];
}

async function fetchBlogPostsFromRemoteUrl(url: string): Promise<BlogPost[]> {
  const res = await fetch(url, {
    next: { revalidate: 120, tags: ["blog-posts"] },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    return [];
  }
  const json = (await res.json().catch(() => null)) as unknown;
  return parseBlogPostsPayload(json);
}

async function fetchBlogPostsFromShopenupBackend(): Promise<BlogPost[]> {
  try {
    const articles = await blogService.getPublishedArticles({ limit: 100, offset: 0 });
    const posts = articles.map(normalizeBlogRow).filter((x): x is BlogPost => Boolean(x));
    if (process.env.NODE_ENV === "development" && articles.length > 0 && posts.length === 0) {
      console.warn(
        "[blog-posts] Backend returned articles but none could be normalized (check title/slug fields)."
      );
    }
    return posts;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[blog-posts] GET ${SHOPENUP_BACKEND_URL}/store/custom/blog/articles failed — fix URL, publishable key, or backend route. Error:`,
        e
      );
    }
    return [];
  }
}

async function fetchBlogPostBySlugFromBackend(slugKey: string): Promise<BlogPost | undefined> {
  try {
    const article = await blogService.getArticleBySlug(slugKey);
    if (!article) {
      return undefined;
    }
    return normalizeBlogRow(article) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Blog listing + single post source. Priority:
 * 1. Shopenup backend — `blogService` → `GET /store/custom/blog/articles` (see `lib/shopenup/blog-service.ts`).
 * 2. `NEXT_PUBLIC_BLOG_POSTS_JSON_URL` — GET JSON (array or `{ posts | data | articles | … }`).
 * 3. `BLOG_POSTS_JSON` — server-only raw JSON string (same shapes).
 * 4. Fallback: `blogPosts` in `lib/store-data.ts` only when no explicit Shopenup URL is set (default localhost probe).
 */
export async function getBlogPostsForPage(): Promise<BlogPost[]> {
  const fromBackend = await fetchBlogPostsFromShopenupBackend();
  if (fromBackend.length > 0) {
    return fromBackend;
  }

  if (process.env.NODE_ENV === "development" && isExplicitShopenupBackendUrlSet()) {
    console.warn(
      "[blog-posts] Backend returned 0 posts. Publish articles (turn off draft) or verify GET /store/custom/blog/articles."
    );
  }

  const url = process.env.NEXT_PUBLIC_BLOG_POSTS_JSON_URL?.trim();
  if (url) {
    try {
      const parsed = await fetchBlogPostsFromRemoteUrl(url);
      if (parsed.length) {
        return parsed;
      }
    } catch {
      /* use fallbacks */
    }
  }

  const inline = process.env.BLOG_POSTS_JSON?.trim();
  if (inline) {
    try {
      const json = JSON.parse(inline) as unknown;
      const parsed = parseBlogPostsPayload(json);
      if (parsed.length) {
        return parsed;
      }
    } catch {
      /* fallback */
    }
  }

  if (isExplicitShopenupBackendUrlSet()) {
    return [];
  }

  return blogPosts;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const decoded = decodeURIComponent(slug || "").trim();
  if (!decoded) {
    return undefined;
  }
  const key = decoded.toLowerCase();

  const direct = await fetchBlogPostBySlugFromBackend(decoded);
  if (direct) {
    return direct;
  }

  const posts = await getBlogPostsForPage();
  return posts.find((p) => p.slug.toLowerCase() === key);
}
