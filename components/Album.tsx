"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { Shot } from "@/lib/data";
import { getLenis } from "./SmoothScroll";
import { useLang, useT } from "./I18n";
import { localeInfo } from "@/lib/i18n/config";

const ease = [0.22, 1, 0.36, 1] as const;

/** A project's screenshots: bento grid that opens a full-screen viewer. */
export default function Album({ shots, accent, name }: { shots: Shot[]; accent: string; name: string }) {
  const t = useT();
  const rtl = localeInfo[useLang()].dir === "rtl";
  const [open, setOpen] = useState<number | null>(null);
  const [dir, setDir] = useState(1);

  const go = useCallback(
    (step: number) => {
      setDir(step);
      setOpen((i) => (i === null ? i : (i + step + shots.length) % shots.length));
    },
    [shots.length]
  );

  useEffect(() => {
    if (open === null) return;
    const l = getLenis();
    l?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      l?.start();
    };
  }, [open, go, rtl]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-6">
        {shots.map((g, i) => (
          <motion.button
            key={g.src}
            onClick={() => {
              setDir(1);
              setOpen(i);
            }}
            data-cursor={t.caseUi.open}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.8, delay: (i % 3) * 0.08, ease }}
            className={`group relative overflow-hidden rounded-3xl border border-line bg-ink-2 text-start ${
              i === 0 ? "md:col-span-6" : i < 3 ? "md:col-span-3" : "md:col-span-3"
            }`}
            aria-label={`${t.caseUi.open} ${i + 1}: ${g.alt}`}
          >
            <Image
              src={g.src}
              alt={g.alt}
              width={g.w}
              height={g.h}
              sizes={i === 0 ? "100vw" : "50vw"}
              className="h-auto w-full transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink/90 to-transparent p-5 pt-16 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-sm font-medium">{g.alt}</span>
              <span className="font-mono text-xs" style={{ color: accent }}>
                {String(i + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
              </span>
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} screenshots`}
            className="fixed inset-0 z-[120] flex flex-col bg-ink/95 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <div className="flex items-center justify-between px-5 py-4 md:px-8" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-sm font-bold uppercase tracking-wider">
                {name}{" "}
                <span className="ml-2 font-mono text-xs font-normal" style={{ color: accent }}>
                  {String(open + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
                </span>
              </p>
              <button onClick={() => setOpen(null)} className="grid h-11 w-11 place-items-center rounded-full border border-line text-xl hover:border-paper/50" aria-label={t.caseUi.close}>
                ×
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 md:px-20" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                <motion.div
                  key={open}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 80, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: dir * -80, scale: 0.96 }}
                  transition={{ duration: 0.45, ease }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) go(rtl ? -1 : 1);
                    else if (info.offset.x > 60) go(rtl ? 1 : -1);
                  }}
                  className="relative max-h-full w-full max-w-6xl"
                >
                  <Image
                    src={shots[open].src}
                    alt={shots[open].alt}
                    width={shots[open].w}
                    height={shots[open].h}
                    sizes="100vw"
                    className="mx-auto h-auto max-h-[72vh] w-auto rounded-2xl border border-line object-contain"
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
              <button onClick={() => go(-1)} aria-label={t.caseUi.prev} className="absolute start-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink-2/80 text-xl hover:border-paper/50 md:grid">
                <span className="flip-rtl">←</span>
              </button>
              <button onClick={() => go(1)} aria-label={t.caseUi.nextShot} className="absolute end-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink-2/80 text-xl hover:border-paper/50 md:grid">
                <span className="flip-rtl">→</span>
              </button>
            </div>

            <div className="px-5 pb-5 pt-4 md:px-8" onClick={(e) => e.stopPropagation()}>
              <p className="mb-4 text-center text-sm text-dim">{shots[open].alt}</p>
              <div className="flex justify-center gap-2 overflow-x-auto">
                {shots.map((g, i) => (
                  <button
                    key={g.src}
                    onClick={() => {
                      setDir(i > open ? 1 : -1);
                      setOpen(i);
                    }}
                    aria-label={`${t.caseUi.open} ${i + 1}`}
                    className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border transition-opacity ${i === open ? "opacity-100" : "border-line opacity-40 hover:opacity-80"}`}
                    style={i === open ? { borderColor: accent } : undefined}
                  >
                    <Image src={g.src} alt="" fill sizes="96px" className="object-cover object-top" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
