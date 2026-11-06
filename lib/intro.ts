/**
 * Seconds to wait before the first entrance animations.
 * The preloader only runs once per tab session, so later visits animate right away.
 */
export function introDelay() {
  if (typeof window === "undefined") return 1.8;
  try {
    if (sessionStorage.getItem("seen") || location.search.includes("nointro")) return 0.15;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  } catch {}
  return 1.8;
}
