"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Shape3D } from "./three/Lazy3D";
import type { ShapeKind } from "./three/ShapeScene";
import { introDelay } from "@/lib/intro";

const ease = [0.22, 1, 0.36, 1] as const;

export default function PageHeader({
  eyebrow,
  title,
  intro,
  shape,
  compact = false,
  children,
}: {
  eyebrow: string;
  title: ReactNode[];
  intro?: ReactNode;
  shape: ShapeKind;
  compact?: boolean;
  children?: ReactNode;
}) {
  const d = introDelay();
  return (
    <section className={`relative overflow-hidden ${compact ? "pb-10 pt-32 md:pb-12 md:pt-36" : "pb-20 pt-40 md:pb-28 md:pt-48"}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_20%,rgba(198,66,243,.18),transparent_50%),radial-gradient(ellipse_at_60%_80%,rgba(69,188,244,.08),transparent_50%)]" />
      <div aria-hidden className={`pointer-events-none absolute hidden md:block ${compact ? "-end-10 top-10 h-[380px] w-[380px] lg:end-10" : "-end-24 top-16 h-[560px] w-[560px] lg:end-0"}`}>
        <Shape3D kind={shape} />
      </div>
      <div className="relative mx-auto max-w-7xl px-5">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d, duration: 0.6 }}
          className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-brand-2"
        >
          {eyebrow}
        </motion.p>
        <h1 className={`font-display font-extrabold uppercase leading-[0.9] tracking-[-0.035em] ${compact ? "max-w-4xl text-[clamp(1.4rem,5.6vw,3.8rem)]" : "max-w-6xl text-[clamp(1.6rem,6vw,5.4rem)]"}`}>
          {title.map((l, i) => (
            <span key={i} className="block overflow-hidden pb-[0.06em]">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: d + 0.05 + i * 0.08, duration: 1, ease }}>
                {l}
              </motion.span>
            </span>
          ))}
        </h1>
        {intro && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: d + 0.35, duration: 0.8, ease }}
            className={`max-w-xl text-lg leading-relaxed text-dim ${compact ? "mt-5" : "mt-8"}`}
          >
            {intro}
          </motion.div>
        )}
        {children && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d + 0.45, duration: 0.8, ease }} className="mt-10">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
