import { NextResponse } from "next/server";
import { SHOPENUP_BACKEND_URL } from "@/lib/config";
import { blogService } from "@/lib/shopenup/blog-service";

export const dynamic = "force-dynamic";

/**
 * Debug: same blog fetch as `/blog`, but runs when you open this URL in the browser,
 * so DevTools → Network shows a Fetch to **this** origin (not to :9000 — that call is server-side only).
 */
export async function GET() {
  try {
    const articles = await blogService.getPublishedArticles({ limit: 100, offset: 0 });
    return NextResponse.json({
      ok: true,
      backendBaseUrl: SHOPENUP_BACKEND_URL,
      count: articles.length,
      articles,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        backendBaseUrl: SHOPENUP_BACKEND_URL,
        error: message,
      },
      { status: 500 }
    );
  }
}
