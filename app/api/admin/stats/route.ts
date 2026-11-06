import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ensurePortalTables, getPortfolioStats } from "@/lib/portal-db";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await ensurePortalTables();
    const stats = await getPortfolioStats();
    return NextResponse.json({
      allTime: {
        pageViews: Number(stats.allTime?.page_views ?? 0),
        contactRequests: Number(stats.allTime?.contact_requests ?? 0),
      },
      lastSevenDays: {
        pageViews: Number(stats.lastSevenDays?.page_views ?? 0),
        contactRequests: Number(stats.lastSevenDays?.contact_requests ?? 0),
      },
      topPages: stats.topPages.map((page) => ({
        path: page.page_path,
        views: Number(page.views),
      })),
    });
  } catch (error) {
    console.error("[admin/stats] failed to load statistics:", error);
    return NextResponse.json({ error: "Could not load statistics." }, { status: 503 });
  }
}
