import fs from "node:fs/promises";
import path from "node:path";

const ASSET_ROOT = path.join(process.cwd(), "..", "lumin", "lumin", "assets");

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

type RouteContext = {
  params: {
    path: string[];
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const safePath = params.path
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, ""))
    .join("/");

  if (!safePath) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(ASSET_ROOT, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  try {
    const file = await fs.readFile(filePath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
