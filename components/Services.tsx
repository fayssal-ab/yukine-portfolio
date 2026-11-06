"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useT } from "./I18n";
import { Eyebrow, RevealText } from "./ui";

export default function Services() {
  const t = useT();
  const services = t.services.items;
  const [open, setOpen] = useState(0);

  return (
    <section className="relative border-t border-line py-32 md:py-44">
      <div className="mx-auto max-w-7xl px-5">
        <Eyebrow n="02">{t.services.eyebrow}</Eyebrow>
        <h2 className="mb-16 font-display text-[clamp(1.8rem,7vw,5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]">
          <RevealText lines={[t.services.title[0], <span key="b" className="text-outline">{t.services.title[1]}</span>]} />
        </h2>

        <ul className="border-t border-line">
          {services.map((s, i) => {
            const active = open === i;
            return (
              <li key={s.title} className="border-b border-line">
                <button
                  onClick={() => setOpen(active ? -1 : i)}
                  aria-expanded={active}
                  className="group relative flex w-full items-center gap-6 overflow-hidden py-8 text-start md:py-10"
                >
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 origin-bottom bg-brand"
                    initial={false}
                    animate={{ scaleY: active ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <span className={`relative hidden w-12 font-mono md:block text-sm transition-colors ${active ? "text-[#0d0618]" : "text-brand"}`}>0{i + 1}</span>
                  <span
                    className={`relative flex-1 font-display text-[clamp(1.4rem,4.4vw,3.8rem)] font-extrabold uppercase leading-none tracking-[-0.02em] transition-all duration-500 ${
                      active ? "translate-x-2 rtl:-translate-x-2 text-[#0d0618] md:translate-x-6 md:rtl:-translate-x-6" : ""
                    }`}
                  >
                    {s.title}
                  </span>
                  <motion.span
                    className={`relative mr-4 text-3xl ${active ? "text-[#0d0618]" : "text-dim"}`}
                    animate={{ rotate: active ? 45 : 0 }}
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-6 py-8 md:grid-cols-[3rem_1fr_1fr] md:ps-6">
                        <span />
                        <p className="max-w-md text-lg text-paper">{s.text}</p>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {s.points.map((p) => (
                            <li key={p} className="flex gap-2 text-sm text-dim">
                              <span className="text-brand">✦</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
