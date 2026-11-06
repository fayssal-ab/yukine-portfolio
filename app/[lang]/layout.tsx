import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Syne, Inter, JetBrains_Mono, Noto_Kufi_Arabic, IBM_Plex_Sans_Arabic } from "next/font/google";
import "lenis/dist/lenis.css";
import "../globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import { I18nProvider } from "@/components/I18n";
import { site } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { isLocale, localeInfo, locales } from "@/lib/i18n/config";

// Latin scripts: Syne (display) + Inter (body), with accents (latin-ext).
const display = Syne({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700", "800"], variable: "--font-syne" });
const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jb" });
// Arabic: Noto Kufi Arabic for headings, IBM Plex Sans Arabic for text.
const arDisplay = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["500", "700", "800", "900"], variable: "--font-ar-display" });
const arBody = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600"], variable: "--font-ar-body" });

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDict(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.title, template: "%s · YUKINE" },
    description: t.meta.description,
    alternates: { languages: Object.fromEntries(locales.map((l) => [localeInfo[l].html, `/${l}`])) },
    openGraph: { title: t.meta.title, description: t.meta.description, images: ["/projects/ravo-home.webp"], siteName: "YUKINE", locale: localeInfo[lang].html },
    twitter: { card: "summary_large_image", creator: "@yuuukine1" },
  };
}

export const viewport: Viewport = { themeColor: "#0a0712" };

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDict(lang);
  const info = localeInfo[lang];
  const fonts = [display, body, mono, arDisplay, arBody].map((f) => f.variable).join(" ");

  return (
    <html lang={info.html} dir={info.dir} className={fonts}>
      <body>
        <I18nProvider lang={lang} t={t}>
          <Preloader />
          <SmoothScroll />
          <Cursor />
          <div className="grain" aria-hidden />
          <Nav />
          <main>{children}</main>
          <Footer />
          <ContactDock />
        </I18nProvider>
      </body>
    </html>
  );
}
