"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:admin|login|api|_next)(?:\/|$)/i.test(pathname)) return;
    void fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch((error: unknown) => {
      console.warn("[analytics] page view request failed:", error);
    });
  }, [pathname]);

  return null;
}
