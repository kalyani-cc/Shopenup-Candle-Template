import { NextResponse } from "next/server";
import { parseShopenupJwtFromCookieHeader } from "@/lib/shopenup/cookies";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json({ message: "orderId required" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Missing NEXT_PUBLIC_SHOPENUP_BACKEND_URL", exists: false },
      { status: 500 }
    );
  }
  if (!publishableKey) {
    return NextResponse.json(
      { message: "Missing NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY", exists: false },
      { status: 500 }
    );
  }

  try {
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

    let res: Response;
    try {
      res = await fetch(invoiceUrl, {
        method: "HEAD",
        headers,
        cache: "no-store",
      });
    } catch {
      res = await fetch(invoiceUrl, {
        method: "GET",
        headers,
        cache: "no-store",
      });
    }

    return NextResponse.json({ exists: res.ok }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Failed to check invoice existence", exists: false },
      { status: 500 }
    );
  }
}

