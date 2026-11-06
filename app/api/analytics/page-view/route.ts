import { NextResponse } from "next/server";
import { isSameOrigin, rateLimitIdentifier } from "@/lib/admin-api";
import { consumeRateLimit, ensurePortalTables, recordPageView } from "@/lib/portal-db";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const pagePath = typeof body.path === "string" ? body.path.trim() : "";
  if (
    pagePath.length > 512 ||
    !pagePath.startsWith("/") ||
    pagePath.startsWith("//") ||
    /[?#\\]/.test(pagePath) ||
    /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:admin|login|api|_next)(?:\/|$)/i.test(pagePath)
  ) {
    return NextResponse.json({ error: "Invalid page path." }, { status: 400 });
  }

  try {
    await ensurePortalTables();
    const identifier = await rateLimitIdentifier(request);
    if ((await consumeRateLimit(identifier, "page-view", 600)) > 60) {
      return new NextResponse(null, { status: 204 });
    }
    await recordPageView(pagePath);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[analytics/page-view] failed to record page view:", error);
    return NextResponse.json({ error: "Could not record page view." }, { status: 503 });
  }
}
