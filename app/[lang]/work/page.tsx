import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { CaseStack } from "@/components/Work";
import ProjectGrid from "@/components/ProjectGrid";
import CTA from "@/components/CTA";
import { Eyebrow, RevealText } from "@/components/ui";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = getDict((await params).lang as Locale);
  return { title: t.nav.work, description: t.work.pageIntro };
}

export default async function WorkPage({ params }: P) {
  const t = getDict((await params).lang as Locale);
  return (
    <>
      <PageHeader
        eyebrow={t.work.pageEyebrow}
        shape="mascot-laptop"
        title={[t.work.pageTitle[0], <span key="s" className="text-gradient">{t.work.pageTitle[1]}</span>]}
        intro={t.work.pageIntro}
      />
      <CaseStack />
      <section className="border-t border-line py-28 md:py-40">
        <div className="mx-auto max-w-7xl px-5">
          <Eyebrow n="02">{t.work.otherEyebrow}</Eyebrow>
          <h2 className="mb-14 font-display text-[clamp(1.4rem,6vw,4.5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
            <RevealText lines={[t.work.otherTitle[0], <span key="t" className="text-outline">{t.work.otherTitle[1]}</span>]} />
          </h2>
          <ProjectGrid />
        </div>
      </section>
      <CTA shape="mascot-cheer" />
    </>
  );
}
