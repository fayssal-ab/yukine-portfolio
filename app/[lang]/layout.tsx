import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "@/lib/fonts";
import "lenis/dist/lenis.css";
import "../globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import PageViewTracker from "@/components/PageViewTracker";
import { I18nProvider } from "@/components/I18n";
import { site } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { isLocale, localeInfo, locales } from "@/lib/i18n/config";

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

  return (
    <html lang={info.html} dir={info.dir} className={fontVariables}>
      <body>
        <I18nProvider lang={lang} t={t}>
          <PageViewTracker />
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
