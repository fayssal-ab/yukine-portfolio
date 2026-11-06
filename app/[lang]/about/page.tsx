import type { Metadata } from "next";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import CTA from "@/components/CTA";
import { Statement, Stats, Timeline, Tools } from "@/components/AboutBlocks";
import { Eyebrow, FadeUp } from "@/components/ui";
import { Mascot3D } from "@/components/three/Lazy3D";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = getDict((await params).lang as Locale);
  return { title: t.nav.about, description: t.about.intro };
}

export default async function AboutPage({ params }: P) {
  const t = getDict((await params).lang as Locale);
  const a = t.about;
  return (
    <>
      <PageHeader eyebrow={a.eyebrow} shape="blob" title={[a.title[0], <span key="y" className="text-gradient">{a.title[1]}</span>]} intro={a.intro}>
        <div className="flex items-center gap-5">
          <span className="rounded-full bg-gradient-to-br from-brand to-brand-2 p-[3px]">
            <Image src="/logo.webp" alt="YUKINE" width={96} height={96} className="rounded-full" priority />
          </span>
          <div className="text-sm text-dim">
            <p className="font-display text-lg font-bold text-paper">YUKINE</p>
            <p>{a.tagline}</p>
          </div>
        </div>
      </PageHeader>

      <section className="border-t border-line py-28 md:py-40">
        <div className="mx-auto max-w-7xl px-5">
          <Eyebrow n="01">{a.whatEyebrow}</Eyebrow>
          <Statement text={a.statement} />
          <div className="mt-24">
            <Stats />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-line bg-ink-2">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-20 md:grid-cols-[1fr_1.2fr]">
          <div>
            <Eyebrow n="02">{a.meet}</Eyebrow>
            <p className="font-display text-[clamp(2rem,5vw,4rem)] font-extrabold uppercase leading-[0.95]">
              <span className="text-gradient">Kai</span>
            </p>
            <p className="mt-4 text-lg text-dim">{a.meetText}</p>
          </div>
          <div className="relative h-[420px] md:h-[560px]">
            <Mascot3D />
          </div>
        </div>
      </section>

      <section className="border-t border-line py-28 md:py-40">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Eyebrow n="03">{a.pathEyebrow}</Eyebrow>
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
              {a.pathTitle[0]} <span className="text-outline">{a.pathTitle[1]}</span>
            </h2>
          </div>
          <Timeline />
        </div>
      </section>

      <section className="border-t border-line py-28 md:py-40">
        <div className="mx-auto max-w-7xl px-5">
          <Eyebrow n="04">{a.toolbox}</Eyebrow>
          <FadeUp>
            <Tools />
          </FadeUp>
        </div>
      </section>
      <CTA shape="mascot-cheer" />
    </>
  );
}
