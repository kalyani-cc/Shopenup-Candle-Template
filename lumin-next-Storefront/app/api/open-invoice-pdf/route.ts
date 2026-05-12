import { parseShopenupJwtFromCookieHeader } from "@/lib/shopenup/cookies";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  if (!orderId) {
    return Response.json({ message: "orderId required" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY;

  if (!backendUrl) {
    return Response.json({ message: "Missing NEXT_PUBLIC_SHOPENUP_BACKEND_URL" }, { status: 500 });
  }
  if (!publishableKey) {
    return Response.json({ message: "Missing NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY" }, { status: 500 });
  }

  const headers: Record<string, string> = {
    "x-publishable-api-key": publishableKey,
  };

  let incomingAuth = request.headers.get("authorization");
  const incomingCookie = request.headers.get("cookie");
  if (!incomingAuth) {
    const jwt = parseShopenupJwtFromCookieHeader(incomingCookie);
    if (jwt) incomingAuth = `Bearer ${jwt}`;
  }
  if (incomingAuth) headers.authorization = incomingAuth;
  if (incomingCookie) headers.cookie = incomingCookie;

  const invoiceUrl = `${backendUrl}/store/orders/${encodeURIComponent(orderId)}/invoices`;
  const upstream = await fetch(invoiceUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return Response.json(
      { message: text || `Invoice fetch failed: ${upstream.statusText}` },
      { status: upstream.status }
    );
  }

  const contentType = upstream.headers.get("content-type") || "application/pdf";
  const contentDisposition =
    upstream.headers.get("content-disposition") || `inline; filename="invoice-${orderId}.pdf"`;

  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

