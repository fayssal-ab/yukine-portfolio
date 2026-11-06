"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Link, useT } from "./I18n";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { CaseStudy } from "@/lib/data";
import { introDelay } from "@/lib/intro";

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function CaseHero({ c }: { c: CaseStudy }) {
  const t = useT();
  const d = introDelay();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const meta = [
    [t.caseUi.client, `${c.short} · ${t.caseUi.streamer}`],
    [t.caseUi.partner, c.partner],
    [t.caseUi.year, c.year],
    [t.caseUi.role, t.caseUi.roleValue],
  ];

  return (
    <section className="relative overflow-hidden pt-36 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute -end-40 top-0 h-[640px] w-[640px] rounded-full opacity-20 blur-3xl" style={{ background: c.accent }} />
      <div className="relative mx-auto max-w-7xl px-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d, duration: 0.6 }} className="flex items-center gap-3">
          <Link href="/work" className="font-mono text-xs uppercase tracking-[0.2em] text-dim hover:text-paper">
            <span className="flip-rtl">←</span> {t.caseUi.back}
          </Link>
          <span className="text-line">/</span>
          <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: c.accent }}>
            <Image src={c.logo} alt="" width={20} height={20} className="rounded" />
            {c.tag}
          </span>
        </motion.div>

        <h1 className="mt-8 overflow-hidden font-display text-[clamp(1.3rem,5vw,4.4rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.035em]">
          <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: d + 0.05, duration: 1, ease }}>
            {c.name}
          </motion.span>
        </h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d + 0.3, duration: 0.8, ease }} className="mt-8 max-w-2xl text-lg text-dim">
          {c.blurb}
        </motion.p>

        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d + 0.4, duration: 0.8, ease }}
          className="mt-12 grid grid-cols-2 gap-6 border-t border-line pt-8 md:grid-cols-5"
        >
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">{k}</dt>
              <dd className="mt-2 font-medium">{v}</dd>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1">
            <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">{c.link.live ? t.caseUi.live : t.caseUi.code}</dt>
            <dd className="mt-2">
              <a href={c.link.href} target="_blank" rel="noopener" className="font-medium underline-offset-4 hover:underline" style={{ color: c.accent }}>
                {c.link.label} <span className="flip-rtl">↗</span>
              </a>
            </dd>
          </div>
        </motion.dl>

        <ul className="mt-8 flex flex-wrap gap-2">
          {c.stack.map((s) => (
            <li key={s} className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-dim">
              {s}
            </li>
          ))}
        </ul>
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: d + 0.5, duration: 1.1, ease }}
        className="relative mx-auto mt-16 max-w-7xl px-4 pb-24 md:pb-32"
      >
        <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] border border-line bg-ink-2">
          <motion.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0">
            <Image src={c.main.src} alt={c.main.alt} fill priority sizes="100vw" className="object-cover object-top" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
