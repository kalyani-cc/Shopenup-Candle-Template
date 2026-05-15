import { sdk } from "@/lib/config";

/** Matches store route `GET /store/custom/blog/articles` (published rows only). */
const STORE_BLOG_ARTICLES_PATH = "/store/custom/blog/articles";

export interface BlogArticle {
  id: string;
  title: string;
  subtitle?: string | null;
  author: string;
  author_expert_title?: string | null;
  url_slug: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  thumbnail_image?: string | null;
  tags: string[];
  body: {
    type: string;
    content: Array<{
      type: string;
      attrs?: {
        level?: number;
      };
      content?: Array<{
        type: string;
        text: string;
      }>;
    }>;
  } | null;
  draft: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BlogArticleListResponse {
  articles: BlogArticle[];
  count: number;
  offset: number;
  limit: number;
}

export interface BlogSearchParams {
  q?: string;
  author?: string;
  tags?: string[];
  draft?: boolean;
  sortBy?: "created_at" | "updated_at" | "title";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface BlogFilter {
  author?: string;
  tags?: string[];
  draft?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  search?: string;
}

function normalizeTags(raw: unknown): string[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === "string");
  }
  return [];
}

function emptyDocBody(): BlogArticle["body"] {
  return { type: "doc", content: [] };
}

export class ShopenupBlogService {
  private normalizeArticle(raw: Partial<BlogArticle> & Record<string, unknown>): BlogArticle {
    const tags = normalizeTags(raw.tags);
    const body =
      raw.body != null && typeof raw.body === "object"
        ? (raw.body as BlogArticle["body"])
        : emptyDocBody();

    return {
      id: String(raw.id ?? ""),
      title: String(raw.title ?? ""),
      subtitle: raw.subtitle != null ? String(raw.subtitle) : null,
      author: String(raw.author ?? ""),
      author_expert_title:
        raw.author_expert_title != null ? String(raw.author_expert_title) : null,
      url_slug: raw.url_slug != null ? String(raw.url_slug) : null,
      seo_title: raw.seo_title != null ? String(raw.seo_title) : null,
      seo_description:
        raw.seo_description != null ? String(raw.seo_description) : null,
      thumbnail_image:
        raw.thumbnail_image != null ? String(raw.thumbnail_image) : null,
      tags,
      body,
      draft: (() => {
        const d = (raw as Record<string, unknown>).draft;
        return d === true || d === "true" || String(d).toLowerCase() === "true";
      })(),
      created_at: String(raw.created_at ?? ""),
      updated_at: String(raw.updated_at ?? ""),
      deleted_at:
        raw.deleted_at != null && raw.deleted_at !== ""
          ? String(raw.deleted_at)
          : null,
    };
  }

  /** Thumbnails: pass through; storefront normalizes absolute URLs when mapping to `BlogPost`. */
  private convertToRelativeUrl(url?: string | null): string | undefined {
    if (!url?.trim()) {
      return undefined;
    }
    return url.trim();
  }

  private withThumb(a: BlogArticle): BlogArticle {
    const thumb = this.convertToRelativeUrl(a.thumbnail_image);
    return {
      ...a,
      thumbnail_image: thumb ?? a.thumbnail_image,
    };
  }

  private async fetchEnvelope(
    limit: number,
    offset: number,
    slug?: string
  ): Promise<BlogArticleListResponse> {
    const query: Record<string, string | number> = { limit, offset };
    if (slug) {
      query.slug = slug;
    }

    const res = await sdk.client.fetch<
      Partial<BlogArticleListResponse> & { articles?: unknown[] }
    >(STORE_BLOG_ARTICLES_PATH, {
      query,
      /* Avoid caching an empty list in dev while wiring backend / publish flags. */
      ...(process.env.NODE_ENV === "development"
        ? { cache: "no-store" as const }
        : { next: { revalidate: 120, tags: ["blog-articles"] } }),
    });

    const rawList = Array.isArray(res?.articles) ? res!.articles : [];
    const articles = rawList.map((row) =>
      this.withThumb(this.normalizeArticle(row as Partial<BlogArticle> & Record<string, unknown>))
    );

    return {
      articles,
      count: res?.count ?? articles.length,
      offset: res?.offset ?? offset,
      limit: res?.limit ?? limit,
    };
  }

  /** Store API caps `limit` at 100; fetch multiple pages up to `maxItems`. */
  private async fetchPublishedPages(maxItems = 500): Promise<BlogArticle[]> {
    const out: BlogArticle[] = [];
    let offset = 0;
    const pageSize = 100;

    while (out.length < maxItems) {
      const env = await this.fetchEnvelope(pageSize, offset);
      if (!env.articles.length) {
        break;
      }
      out.push(...env.articles);
      if (env.articles.length < pageSize || out.length >= env.count) {
        break;
      }
      offset += pageSize;
    }

    return out;
  }

  private sortArticles(
    articles: BlogArticle[],
    sortBy: BlogSearchParams["sortBy"],
    sortOrder: BlogSearchParams["sortOrder"]
  ): BlogArticle[] {
    const key = sortBy ?? "created_at";
    const dir = sortOrder === "asc" ? 1 : -1;
    const copy = [...articles];
    copy.sort((a, b) => {
      if (key === "title") {
        return a.title.localeCompare(b.title) * dir;
      }
      const ta = new Date(key === "updated_at" ? a.updated_at : a.created_at).getTime();
      const tb = new Date(key === "updated_at" ? b.updated_at : b.created_at).getTime();
      return (ta - tb) * dir;
    });
    return copy;
  }

  private filterArticles(
    articles: BlogArticle[],
    params?: BlogSearchParams
  ): BlogArticle[] {
    let list = articles;

    if (params?.draft === true) {
      list = [];
    } else {
      list = list.filter((a) => !a.draft);
    }

    if (params?.author?.trim()) {
      const a = params.author.trim().toLowerCase();
      list = list.filter((x) => x.author.toLowerCase().includes(a));
    }

    if (params?.tags?.length) {
      const want = new Set(params.tags.map((t) => t.toLowerCase()));
      list = list.filter((x) =>
        x.tags.some((t) => want.has(t.toLowerCase()))
      );
    }

    if (params?.q?.trim()) {
      const q = params.q.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          (x.subtitle && String(x.subtitle).toLowerCase().includes(q)) ||
          (x.seo_description && String(x.seo_description).toLowerCase().includes(q))
      );
    }

    list = this.sortArticles(list, params?.sortBy, params?.sortOrder);

    const lim = params?.limit ?? list.length;
    const off = params?.offset ?? 0;
    return list.slice(off, off + lim);
  }

  async getArticles(params?: BlogSearchParams): Promise<BlogArticle[]> {
    try {
      const cap = Math.min((params?.limit ?? 100) + (params?.offset ?? 0), 500);
      const needClientFilter =
        Boolean(params?.q?.trim()) ||
        Boolean(params?.author?.trim()) ||
        Boolean(params?.tags?.length) ||
        params?.sortBy != null ||
        params?.sortOrder != null ||
        (params?.draft ?? false) === true;

      if (needClientFilter || cap > 100) {
        const all = await this.fetchPublishedPages(500);
        return this.filterArticles(all, params);
      }

      const limit = Math.min(params?.limit ?? 100, 100);
      const offset = params?.offset ?? 0;
      const env = await this.fetchEnvelope(limit, offset);
      return env.articles;
    } catch (error) {
      console.error("Failed to get blog articles:", error);
      throw error;
    }
  }

  async getArticle(articleId: string): Promise<BlogArticle | null> {
    try {
      const env = await this.fetchEnvelope(5, 0, articleId.trim());
      const row = env.articles[0];
      return row ?? null;
    } catch (error) {
      console.error("Failed to get blog article:", error);
      return null;
    }
  }

  async getArticleBySlug(slug: string): Promise<BlogArticle | null> {
    try {
      const env = await this.fetchEnvelope(5, 0, slug.trim());
      const row = env.articles[0];
      return row ?? null;
    } catch (error) {
      console.error("Failed to get blog article by slug:", error);
      return null;
    }
  }

  async searchArticles(query: string, params?: BlogSearchParams): Promise<BlogArticle[]> {
    return this.getArticles({
      ...params,
      q: query,
    });
  }

  async getArticlesByAuthor(author: string, params?: BlogSearchParams): Promise<BlogArticle[]> {
    return this.getArticles({
      ...params,
      author,
    });
  }

  async getArticlesByTags(tags: string[], params?: BlogSearchParams): Promise<BlogArticle[]> {
    return this.getArticles({
      ...params,
      tags,
    });
  }

  async getPublishedArticles(params?: BlogSearchParams): Promise<BlogArticle[]> {
    return this.getArticles({
      ...params,
      draft: false,
    });
  }

  async getLatestArticles(limit = 10): Promise<BlogArticle[]> {
    return this.getPublishedArticles({
      sortBy: "created_at",
      sortOrder: "desc",
      limit,
      offset: 0,
    });
  }

  async getFeaturedArticles(limit = 5): Promise<BlogArticle[]> {
    const articles = await this.getPublishedArticles({ limit: 50, offset: 0 });
    return this.sortArticles(articles, "created_at", "desc").slice(0, limit);
  }

  async getArticlesByDateRange(
    from: string,
    to: string,
    params?: BlogSearchParams
  ): Promise<BlogArticle[]> {
    const articles = await this.getPublishedArticles({
      ...params,
      limit: 500,
      offset: 0,
    });
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return articles.filter((article) => {
      const articleDate = new Date(article.created_at);
      return articleDate >= fromDate && articleDate <= toDate;
    });
  }

  async getAuthors(): Promise<string[]> {
    const articles = await this.fetchPublishedPages(500);
    const authors = Array.from(new Set(articles.map((article) => article.author)));
    return authors.sort();
  }

  async getTags(): Promise<string[]> {
    const articles = await this.fetchPublishedPages(500);
    const tags = Array.from(
      new Set(articles.flatMap((article) => article.tags || []))
    );
    return tags.sort();
  }

  async getRelatedArticles(articleId: string, limit = 4): Promise<BlogArticle[]> {
    const currentArticle = await this.getArticle(articleId);
    if (!currentArticle?.tags?.length) {
      return [];
    }

    const relatedArticles = await this.getPublishedArticles({ limit: 500, offset: 0 });
    return relatedArticles
      .filter((article) => article.id !== articleId)
      .filter(
        (article) =>
          article.tags?.some((tag) => currentArticle.tags.includes(tag)) ?? false
      )
      .slice(0, limit);
  }

  async getArticlesPaginated(
    page = 1,
    limit = 10,
    params?: BlogSearchParams
  ): Promise<{
    articles: BlogArticle[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const allArticles = await this.getPublishedArticles({
      ...params,
      limit: 500,
      offset: 0,
    });
    const totalItems = allArticles.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const offset = (page - 1) * limit;
    const articles = allArticles.slice(offset, offset + limit);

    return {
      articles,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getArticlesByCategory(category: string, params?: BlogSearchParams): Promise<BlogArticle[]> {
    return this.getArticlesByTags([category], params);
  }

  async getArticleStats(): Promise<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalAuthors: number;
    totalTags: number;
  }> {
    const allArticles = await this.fetchPublishedPages(500);
    const publishedArticles = allArticles.filter((article) => !article.draft);
    const authors = Array.from(new Set(allArticles.map((article) => article.author)));
    const tags = Array.from(
      new Set(allArticles.flatMap((article) => article.tags || []))
    );

    return {
      totalArticles: allArticles.length,
      publishedArticles: publishedArticles.length,
      draftArticles: allArticles.length - publishedArticles.length,
      totalAuthors: authors.length,
      totalTags: tags.length,
    };
  }
}

export const blogService = new ShopenupBlogService();
