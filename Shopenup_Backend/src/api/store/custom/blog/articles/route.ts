import { ShopenupRequest, ShopenupResponse } from "@shopenup/framework/http";

/**
 * Public store endpoint: published blog articles (same source as admin `/admin/blog/articles`).
 * GET /store/custom/blog/articles?limit=&offset=&slug=
 */
export async function GET(req: ShopenupRequest, res: ShopenupResponse) {
  try {
    const query = req.scope.resolve("query") as {
      graph: (args: Record<string, unknown>) => Promise<{
        data?: unknown[];
        metadata?: { count?: number };
      }>;
    };

    const url = new URL(req.url || "", "http://localhost");
    const slugParam = url.searchParams.get("slug")?.trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 100);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

    const baseFilters: Record<string, unknown> = {
      draft: false,
      deleted_at: null,
    };

    const fields = [
      "id",
      "title",
      "subtitle",
      "author",
      "url_slug",
      "thumbnail_image",
      "seo_description",
      "body",
      "created_at",
      "tags",
      "draft",
    ];

    if (slugParam) {
      let rows: unknown[] = [];

      const slugAttempts =
        slugParam !== slugParam.toLowerCase()
          ? [slugParam, slugParam.toLowerCase()]
          : [slugParam];

      for (const s of slugAttempts) {
        const bySlug = await query.graph({
          entity: "blog_article",
          filters: { ...baseFilters, url_slug: s },
          fields,
          pagination: { skip: 0, take: 5 },
        });
        rows = Array.isArray(bySlug.data) ? bySlug.data : [];
        if (rows.length) {
          break;
        }
      }

      if (!rows.length) {
        const byId = await query.graph({
          entity: "blog_article",
          filters: { ...baseFilters, id: slugParam },
          fields,
          pagination: { skip: 0, take: 5 },
        });
        rows = Array.isArray(byId.data) ? byId.data : [];
      }

      const articles = rows;
      return res.status(200).json({
        articles,
        count: articles.length,
        offset: 0,
        limit: articles.length,
      });
    }

    const { data: rows, metadata } = await query.graph({
      entity: "blog_article",
      filters: baseFilters,
      fields,
      pagination: { skip: offset, take: limit },
    });

    const articles = Array.isArray(rows) ? [...rows] : [];
    articles.sort((a: { created_at?: string }, b: { created_at?: string }) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });

    return res.status(200).json({
      articles,
      count: metadata?.count ?? articles.length,
      offset,
      limit,
    });
  } catch (e) {
    console.error("[store/custom/blog/articles]", e);
    return res.status(500).json({
      code: "internal_error",
      message: (e as Error)?.message || "Failed to load blog articles",
    });
  }
}
