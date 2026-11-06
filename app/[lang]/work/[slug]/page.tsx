import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/components/I18n";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { caseSlugs, getCases } from "@/lib/data";
import CTA from "@/components/CTA";
import { CaseHero, Reveal } from "@/components/CaseBlocks";
import Album from "@/components/Album";
import { Eyebrow } from "@/components/ui";

type P = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return caseSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params;
  const c = getCases(getDict(lang as Locale)).find((x) => x.slug === slug);
  if (!c) return {};
  return { title: c.name, description: c.blurb, openGraph: { images: [c.main.src] } };
}

export default async function CasePage({ params }: P) {
  const { lang, slug } = await params;
  const t = getDict(lang as Locale);
  const u = t.caseUi;
  const cases = getCases(t);
  const idx = cases.findIndex((x) => x.slug === slug);
  if (idx < 0) notFound();
  const c = cases[idx];
  const next = cases[(idx + 1) % cases.length];

  return (
    <div style={{ ["--accent" as string]: c.accent }}>
      <CaseHero c={c} />

      {/* overview */}
      <section className="border-t border-line py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_1.6fr]">
          <Eyebrow n="01">{u.overview}</Eyebrow>
          <Reveal className="space-y-6 font-display text-[clamp(1.3rem,2.4vw,2rem)] font-semibold leading-snug">
            {c.overview.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* what was built */}
      <section className="border-t border-line bg-ink-2 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-5">
          <Eyebrow n="02">{u.built}</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.built.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 0.08} className="rounded-3xl border border-line bg-ink p-7">
                <span className="font-mono text-xs" style={{ color: c.accent }}>
                  0{i + 1}
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold">{b.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-dim">{b.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* album */}
      <section className="border-t border-line py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Eyebrow n="03">{u.album} · {c.gallery.length} {u.screens}</Eyebrow>
            <p className="mb-6 text-sm text-dim">{u.albumNote}</p>
          </div>
          <Album shots={c.gallery} accent={c.accent} name={c.name} />
        </div>
      </section>

      {/* challenges */}
      <section className="border-t border-line bg-ink-2 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-5">
          <Eyebrow n="04">{u.problems}</Eyebrow>
          <div className="divide-y divide-line border-y border-line">
            {c.challenges.map((ch, i) => (
              <Reveal key={ch.title} className="grid gap-6 py-10 md:grid-cols-[0.9fr_1fr_1fr] md:gap-10">
                <h3 className="font-display text-2xl font-bold">
                  <span className="mr-3 font-mono text-sm" style={{ color: c.accent }}>
                    0{i + 1}
                  </span>
                  {ch.title}
                </h3>
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dim">{u.problem}</p>
                  <p className="text-dim">{ch.problem}</p>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: c.accent }}>
                    {u.fix}
                  </p>
                  <p>{ch.solution}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* next */}
      <section className="border-t border-line">
        <Link href={`/work/${next.slug}`} data-cursor={u.nextShot} className="group relative block overflow-hidden py-24 md:py-32">
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: `radial-gradient(ellipse at 50% 120%, ${next.accent}33, transparent 60%)` }}
          />
          <div className="relative mx-auto max-w-7xl px-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-dim">{u.next}</p>
            <p className="mt-4 font-display text-[clamp(1.3rem,5vw,4.4rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] transition-colors duration-300 group-hover:text-[color:var(--n)]" style={{ ["--n" as string]: next.accent }}>
              {next.name} <span className="flip-rtl">→</span>
            </p>
          </div>
        </Link>
      </section>

      <CTA shape="mascot-cheer" />
    </div>
  );
}
