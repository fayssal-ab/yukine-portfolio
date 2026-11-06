"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { caseShort, navKeys } from "@/lib/data";
import { stripLocale } from "@/lib/i18n/config";
import { useT } from "@/components/I18n";

const STRIPS = 9;
const out = [0.7, 0, 0.2, 1] as const;

/**
 * "Channel switch": every navigation lands like flipping to a new stream.
 * The screen is sliced into scanline strips that tear away in alternating
 * directions with an RGB split, while a TV-style on-screen display shows the
 * channel number and the page name.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const t = useT();
  const path = stripLocale(usePathname());
  const idx = navKeys.findIndex((n) => (n.href === "/" ? path === "/" : path.startsWith(n.href)));
  const slug = path.startsWith("/work/") ? path.split("/")[2] : "";
  const label = caseShort[slug] ?? (idx >= 0 ? t.nav[navKeys[idx].key] : "YUKINE");
  const ch = String((idx >= 0 ? idx : 0) + 1 + (slug ? 10 : 0)).padStart(2, "0");

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] flex flex-col" dir="ltr">
        {Array.from({ length: STRIPS }).map((_, i) => {
          const dirX = i % 2 ? 1 : -1;
          return (
            <motion.div
              key={i}
              className="relative flex-1 overflow-hidden"
              style={{ marginTop: i ? -1 : 0, background: "#0a0712" }}
              initial={{ x: 0 }}
              animate={{ x: `${dirX * 105}%` }}
              transition={{ duration: 0.62, delay: 0.38 + Math.abs(i - (STRIPS - 1) / 2) * 0.045, ease: out }}
            >
              {/* RGB-split edge that trails each strip */}
              <span
                className="absolute inset-y-0 w-[3px]"
                style={{ [dirX > 0 ? "left" : "right"]: 0, background: i % 3 === 0 ? "#45bcf4" : i % 3 === 1 ? "#c642f3" : "#f6f2e7", boxShadow: "0 0 24px currentColor" }}
              />
              {/* scanlines */}
              <span className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 1px, transparent 1px 4px)" }} />
            </motion.div>
          );
        })}
      </div>

      {/* on-screen display */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[91] flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.18, delay: 0.42 }}
      >
        <motion.div
          className="relative"
          initial={{ scaleY: 0.02, scaleX: 1.4, filter: "brightness(3)" }}
          animate={{ scaleY: 1, scaleX: 1, filter: "brightness(1)" }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 font-mono text-xs tracking-[0.3em] text-dim">
            <span>{t.transition.channel}</span>
            <span className="text-brand-2">{ch}</span>
            <span className="flex items-end gap-[3px]">
              {[4, 7, 10, 13].map((h, i) => (
                <motion.span key={h} className="w-[3px] bg-brand-2" style={{ height: h }} initial={{ opacity: 0.2 }} animate={{ opacity: [0.2, 1] }} transition={{ delay: i * 0.05, duration: 0.1 }} />
              ))}
            </span>
            <span className="ms-3 flex items-center gap-1.5 text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" /> {t.transition.live}
            </span>
          </div>
          <p className="relative mt-3 font-display text-[clamp(2.6rem,11vw,9rem)] font-extrabold uppercase leading-none tracking-[-0.04em] text-paper">
            <span className="absolute inset-0 translate-x-[3px] text-[#45bcf4] opacity-70 mix-blend-screen">{label}</span>
            <span className="absolute inset-0 -translate-x-[3px] text-[#c642f3] opacity-70 mix-blend-screen">{label}</span>
            <span className="relative">{label}</span>
          </p>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.div>
    </>
  );
}
