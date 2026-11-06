import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { describeDbError, ensurePortalTables, getPortfolioStats } from "@/lib/portal-db";

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
      // one entry per UTC day for the last 14 days, oldest first, zero-filled
      daily: Array.from({ length: 14 }, (_, i) => {
        const day = new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10);
        const hit = stats.daily.find((row) => row.day === day);
        return { day, views: Number(hit?.views ?? 0) };
      }),
    });
  } catch (error) {
    console.error("[admin/stats] failed to load statistics:", error);
    return NextResponse.json({ error: `Could not load statistics. ${describeDbError(error)}` }, { status: 503 });
  }
}
