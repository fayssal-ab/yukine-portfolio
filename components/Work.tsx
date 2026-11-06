"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { getCases, type CaseStudy } from "@/lib/data";
import { Link, useT } from "./I18n";
import { Eyebrow, RevealText } from "./ui";

/** Case-study cards that pin and stack on top of each other while scrolling. */
export function CaseStack() {
  const t = useT();
  const cases = getCases(t);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <div ref={ref} className="relative">
      {cases.map((c, i) => (
        <Card key={c.slug} c={c} i={i} n={cases.length} progress={scrollYProgress} range={[i / cases.length, 1]} target={1 - (cases.length - i) * 0.05} />
      ))}
    </div>
  );
}

export default function Work() {
  const t = useT();
  return (
    <section id="featured" className="relative pt-32 md:pt-44">
      <div className="mx-auto max-w-7xl px-5">
        <Eyebrow n="01">{t.work.eyebrow}</Eyebrow>
        <div className="flex flex-col gap-8">
          <h2 className="font-display text-[clamp(1.6rem,6.4vw,5.2rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
            <RevealText lines={[t.work.title[0], <span key="k" className="text-outline">{t.work.title[1]}</span>, t.work.title[2]]} />
          </h2>
          <p className="max-w-md text-lg text-dim md:self-end">
            {t.work.intro}
          </p>
        </div>
      </div>
      <div className="mt-16 md:mt-24">
        <CaseStack />
      </div>
    </section>
  );
}

function Card({ c, i, n, progress, range, target }: { c: CaseStudy; i: number; n: number; progress: MotionValue<number>; range: [number, number]; target: number }) {
  const scale = useTransform(progress, range, [1, target]);
  const local = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: local, offset: ["start end", "start start"] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  const t = useT();
  const href = `/work/${c.slug}`;

  return (
    <div ref={local} className="px-4 py-3 md:sticky md:top-0 md:flex md:h-screen md:items-center md:py-0">
      <motion.article
        style={{ scale, top: `${i * 28}px`, ["--accent" as string]: c.accent }}
        className="relative mx-auto w-full max-w-7xl origin-top overflow-hidden rounded-[28px] border border-line bg-ink-2 md:h-[80vh]"
      >
        <div aria-hidden className="pointer-events-none absolute -end-40 -top-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl" style={{ background: c.accent }} />
        <div className="relative grid h-full gap-8 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:p-10">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-4 font-mono text-xs">
              <span className="flex items-center gap-2" style={{ color: c.accent }}>
                <Image src={c.logo} alt="" width={22} height={22} className="rounded-md" />
                {c.tag}
              </span>
              <span className="text-dim">
                0{i + 1} / 0{n}
              </span>
            </div>
            <h3 className="mt-6 font-display text-[clamp(1rem,4.6vw,1.9rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] md:text-[clamp(1rem,1.9vw,1.9rem)]">
              {c.name}
            </h3>
            <p className="mt-4 text-dim">{c.blurb}</p>
            <ul className="mt-6 space-y-2.5 text-[0.95rem]">
              {c.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: c.accent }} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-5 pt-8">
              <Link href={href} className="group inline-flex items-center gap-3 font-semibold">
                <span className="grid h-11 w-11 place-items-center rounded-full text-ink transition-transform duration-300 group-hover:rotate-45 flip-rtl" style={{ background: c.accent }}>
                  ↗
                </span>
                {t.work.readCase}
              </Link>
              {c.link.live && (
                <a href={c.link.href} target="_blank" rel="noopener" className="text-sm text-dim underline-offset-4 hover:text-paper hover:underline">
                  {t.work.visit} {c.link.label}
                </a>
              )}
            </div>
          </div>

          <Link href={href} data-cursor={t.work.view} aria-label={`${c.name} case study`} className="relative block min-h-[260px] overflow-hidden rounded-2xl border border-line bg-ink">
            <motion.div style={{ scale: imgScale }} className="absolute inset-0">
              <Image src={c.main.src} alt={c.main.alt} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover object-top" />
            </motion.div>
            <div className="absolute bottom-4 end-4 w-[46%] overflow-hidden rounded-xl border border-line shadow-[0_20px_60px_rgba(0,0,0,.7)]">
              <Image src={c.sub.src} alt={c.sub.alt} width={c.sub.w} height={c.sub.h} className="h-auto w-full" />
            </div>
          </Link>
        </div>
      </motion.article>
    </div>
  );
}
