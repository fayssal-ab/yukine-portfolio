import { NextResponse, type NextRequest } from "next/server";
import { isLocale, matchLocale } from "@/lib/i18n/config";

// Sends every page request to a language-prefixed URL: the visitor's saved
// choice first (cookie), then their browser language.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Private area: /login and /admin, also reachable as /en/login, /ar/admin, /FR/Admin…
  const priv = /^\/(?:([a-z]{2}(?:-[a-z]{2})?)\/)?(admin|login)(\/.*)?$/i.exec(pathname);
  if (priv && (!priv[1] || isLocale(priv[1].toLowerCase()))) {
    const clean = `/${priv[2].toLowerCase()}${priv[3] ?? ""}`;
    // Sign-in cookies must live on the same host as the OAuth callback, so the
    // private area is only served from the canonical domain.
    const canonical = process.env.CANONICAL_SITE_URL ? new URL(process.env.CANONICAL_SITE_URL) : null;
    // the real public host comes from the headers (nextUrl can hold an internal address)
    const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host).split(",")[0].trim().toLowerCase();
    const wrongHost = !!canonical && host !== canonical.host;
    if (clean === pathname && !wrongHost) return;
    const url = request.nextUrl.clone();
    url.pathname = clean;
    if (canonical) {
      url.protocol = canonical.protocol;
      url.host = canonical.host;
      url.port = canonical.port;
    }
    return NextResponse.redirect(url);
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
