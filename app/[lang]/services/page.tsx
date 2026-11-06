import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Services from "@/components/Services";
import Packages from "@/components/Packages";
import Process from "@/components/Process";
import Faq from "@/components/Faq";
import CTA from "@/components/CTA";
import { Eyebrow, RevealText } from "@/components/ui";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = getDict((await params).lang as Locale);
  return { title: t.nav.services, description: t.services.pageIntro };
}

export default async function ServicesPage({ params }: P) {
  const t = getDict((await params).lang as Locale);
  const s = t.services;
  return (
    <>
      <PageHeader
        eyebrow={s.eyebrow}
        shape="mascot-think"
        title={[s.pageTitle[0], <span key="y" className="text-gradient">{s.pageTitle[1]}</span>, s.pageTitle[2]]}
        intro={s.pageIntro}
      />
      <Services />
      <section className="border-t border-line py-28 md:py-40">
        <div className="mx-auto max-w-7xl px-5">
          <Eyebrow n="03">{s.packagesEyebrow}</Eyebrow>
          <h2 className="mb-6 font-display text-[clamp(1.4rem,6vw,4.5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
            <RevealText lines={[s.packagesTitle[0], <span key="s" className="text-outline">{s.packagesTitle[1]}</span>]} />
          </h2>
          <p className="mb-14 max-w-xl text-lg text-dim">{s.packagesIntro}</p>
          <Packages />
        </div>
      </section>
      <Process />
      <section className="border-t border-line py-28 md:py-40">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <Eyebrow n="05">{t.faq.eyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
              <RevealText lines={[t.faq.title[0], <span key="q" className="text-gradient">{t.faq.title[1]}</span>]} />
            </h2>
          </div>
          <Faq />
        </div>
      </section>
      <CTA shape="mascot-cheer" />
    </>
  );
}
