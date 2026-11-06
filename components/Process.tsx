"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useT } from "./I18n";
import { Eyebrow, RevealText } from "./ui";

export default function Process() {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="relative overflow-hidden border-t border-line bg-ink-2 py-32 md:py-44">
      <div className="mx-auto max-w-7xl px-5">
        <Eyebrow n="03">{t.process.eyebrow}</Eyebrow>
        <h2 className="mb-20 font-display text-[clamp(2.4rem,6vw,5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
          <RevealText lines={[t.process.title[0], <span key="l" className="text-gradient">{t.process.title[1]}</span>]} />
        </h2>

        <div ref={ref} className="relative">
          <div className="absolute left-0 right-0 top-[22px] hidden h-px bg-line xl:block" />
          <motion.div style={{ scaleX: line }} className="absolute left-0 right-0 top-[22px] hidden h-px origin-left rtl:origin-right bg-brand xl:block" />
          <ol className="grid gap-12 md:grid-cols-2 xl:grid-cols-4 md:gap-8">
            {t.process.steps.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.7, delay: i * 0.12 }}
                className="relative"
              >
                <span className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-brand bg-ink font-mono text-sm text-brand">
                  0{i + 1}
                </span>
                <h3 className="mt-8 font-display text-xl font-bold uppercase lg:text-2xl">{s.title}</h3>
                <p className="mt-3 text-dim">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
