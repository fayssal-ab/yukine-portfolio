import { NextResponse, type NextRequest } from "next/server";
import { isLocale, matchLocale } from "@/lib/i18n/config";

// Sends every page request to a language-prefixed URL: the visitor's saved
// choice first (cookie), then their browser language.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (/^\/(?:admin|login)(?:\/|$)/.test(pathname)) {
    // Sign-in cookies must live on the same host as the OAuth callback, so the
    // private area is only served from the canonical domain.
    const canonical = process.env.CANONICAL_SITE_URL;
    if (canonical) {
      const target = new URL(canonical);
      if (request.nextUrl.host !== target.host) {
        const url = request.nextUrl.clone();
        url.protocol = target.protocol;
        url.host = target.host;
        url.port = target.port;
        return NextResponse.redirect(url);
      }
    }
    return;
  }
  const first = pathname.split("/")[1];
  if (isLocale(first)) return;

  const saved = request.cookies.get("lang")?.value;
  const lang = isLocale(saved) ? saved : matchLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // skip API routes, Next internals and any file with an extension (images, icons, robots…)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
