"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useT } from "./I18n";

const ease = [0.76, 0, 0.24, 1] as const;
const R = 76;
const C = 2 * Math.PI * R;

/**
 * First-visit intro: the logo ring fills while the page loads, the name rises,
 * then two panels split open. Shown once per tab session.
 */
export default function Preloader() {
  const t = useT();
  const [show, setShow] = useState(true);
  const [p, setP] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("seen") || location.search.includes("nointro") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(false);
      return;
    }
    const start = performance.now();
    const dur = 1400;
    let id = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      setP(1 - Math.pow(1 - k, 3));
      if (k < 1) id = requestAnimationFrame(tick);
      else {
        sessionStorage.setItem("seen", "1");
        setTimeout(() => setShow(false), 280);
      }
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[200]" exit={{ pointerEvents: "none" }} aria-hidden>
          {/* two panels that split open */}
          <motion.div className="absolute inset-x-0 top-0 h-1/2 bg-ink" exit={{ y: "-100%" }} transition={{ duration: 0.9, ease }} />
          <motion.div className="absolute inset-x-0 bottom-0 h-1/2 bg-ink" exit={{ y: "100%" }} transition={{ duration: 0.9, ease }} />

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35 }}
          >
            <div
              className="pointer-events-none absolute h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(198,66,243,.35), rgba(69,188,244,.12) 45%, transparent 70%)" }}
            />
            <div className="relative h-[180px] w-[180px]">
              <svg viewBox="0 0 180 180" className="absolute inset-0 -rotate-90">
                <defs>
                  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#c642f3" />
                    <stop offset="100%" stopColor="#45bcf4" />
                  </linearGradient>
                </defs>
                <circle cx="90" cy="90" r={R} fill="none" stroke="#2a2239" strokeWidth="2" />
                <circle
                  cx="90"
                  cy="90"
                  r={R}
                  fill="none"
                  stroke="url(#ring)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - p)}
                />
              </svg>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-[18px] overflow-hidden rounded-full"
              >
                <Image src="/logo.webp" alt="" fill sizes="144px" priority className="object-cover" />
              </motion.div>
            </div>

            <div dir="ltr" style={{ fontFamily: "var(--font-syne)" }} className="mt-10 flex overflow-hidden font-display text-3xl font-extrabold tracking-[0.3em]">
              {"YUKINE".split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-3 font-mono text-[11px] uppercase tracking-[0.35em] text-dim"
            >
              {t.preloader.tagline}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
