"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { stack } from "@/lib/data";
import { useT } from "./I18n";
import { FadeUp } from "./ui";

/** Paragraph whose words light up as it scrolls through the viewport. */
export function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className="max-w-6xl font-display text-[clamp(1.6rem,3.6vw,3.1rem)] font-semibold leading-[1.18] tracking-[-0.015em]">
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{" "}
    </>
  );
}

export function Stats() {
  const items = useT().stats.items;
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
      {items.map(([n, l], i) => (
        <FadeUp key={l} delay={i * 0.08} className="border-t border-line pt-6">
          <p className="text-gradient font-display text-5xl font-extrabold md:text-6xl">{n}</p>
          <p className="mt-2 text-sm text-dim">{l}</p>
        </FadeUp>
      ))}
    </div>
  );
}

export function Timeline() {
  const timeline = useT().about.timeline;
  return (
    <ol className="relative border-s border-line">
      {timeline.map((t, i) => (
        <motion.li
          key={t.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          className="relative pb-12 ps-10 last:pb-0"
        >
          <span className="absolute -start-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand bg-ink" />
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-2">{t.when}</p>
          <h3 className="mt-2 font-display text-2xl font-bold">{t.title}</h3>
          <p className="mt-2 max-w-xl text-dim">{t.text}</p>
        </motion.li>
      ))}
    </ol>
  );
}

export function Tools() {
  return (
    <ul className="flex flex-wrap gap-2">
      {stack.map((s) => (
        <li key={s} className="rounded-full border border-line bg-ink-2 px-4 py-2 text-sm transition-colors duration-200 hover:border-brand hover:text-brand">
          {s}
        </li>
      ))}
    </ul>
  );
}
