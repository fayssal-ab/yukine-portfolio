import Hero from "@/components/Hero";
import Clients from "@/components/Clients";
import Marquee from "@/components/Marquee";
import Work from "@/components/Work";
import Services from "@/components/Services";
import Process from "@/components/Process";
import CTA from "@/components/CTA";
import { Stats } from "@/components/AboutBlocks";
import { Eyebrow } from "@/components/ui";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const t = getDict((await params).lang as Locale);
  return (
    <>
      <Hero />
      <Clients />
      <Marquee />
      <Work />
      <Services />
      <Process />
      <section className="border-t border-line py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-5">
          <Eyebrow n="04">{t.stats.eyebrow}</Eyebrow>
          <Stats />
        </div>
      </section>
      <CTA shape="mascot-cheer" />
    </>
  );
}
