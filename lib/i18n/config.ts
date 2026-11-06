export const locales = ["en", "fr", "ar", "de", "es", "es-ar", "pt-br"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeInfo: Record<Locale, { name: string; short: string; html: string; flag: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", short: "EN", html: "en", flag: "🇬🇧", dir: "ltr" },
  fr: { name: "Français", short: "FR", html: "fr", flag: "🇫🇷", dir: "ltr" },
  ar: { name: "العربية", short: "AR", html: "ar", flag: "🇲🇦", dir: "rtl" },
  de: { name: "Deutsch", short: "DE", html: "de", flag: "🇩🇪", dir: "ltr" },
  es: { name: "Español", short: "ES", html: "es", flag: "🇪🇸", dir: "ltr" },
  "es-ar": { name: "Español (Argentina)", short: "AR·ES", html: "es-AR", flag: "🇦🇷", dir: "ltr" },
  "pt-br": { name: "Português (Brasil)", short: "PT", html: "pt-BR", flag: "🇧🇷", dir: "ltr" },
};

export const isLocale = (v: string | undefined | null): v is Locale => !!v && (locales as readonly string[]).includes(v);

/** "/fr/work/ravo" -> "/work/ravo" */
export function stripLocale(path: string) {
  const seg = path.split("/")[1];
  if (isLocale(seg)) return path.slice(seg.length + 1) || "/";
  return path || "/";
}

export function withLocale(lang: Locale, path: string) {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  return `/${lang}${path === "/" ? "" : path}`;
}

/** Picks the best supported locale from an Accept-Language header. */
export function matchLocale(header: string | null): Locale {
  if (!header) return defaultLocale;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    if (isLocale(tag)) return tag;
    if (tag === "es-419" || tag.startsWith("es-ar") || tag.startsWith("es-uy")) return "es-ar";
    if (tag.startsWith("pt")) return "pt-br";
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
