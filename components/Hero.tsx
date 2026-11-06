"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link, useT } from "./I18n";
import { introDelay } from "@/lib/intro";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { Magnetic } from "./ui";
import { Hero3D } from "./three/Lazy3D";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const t = useT();
  const words = t.hero.words;
  const [i, setI] = useState(0);
  const [d] = useState(introDelay);

  // pointer parallax for the floating screenshots + spotlight
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const backX = useTransform(sx, (v) => v * -28);
  const backY = useTransform(sy, (v) => v * -20);
  const frontX = useTransform(sx, (v) => v * 36);
  const frontY = useTransform(sy, (v) => v * 26);
  const rotY = useTransform(sx, (v) => v * 8);
  const rotX = useTransform(sy, (v) => v * -6);

  // fade + sink the hero as you scroll away
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, [words.length]);

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
    ref.current!.style.setProperty("--hx", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--hy", `${e.clientY - r.top}px`);
  };

  return (
    <section
      id="top"
      ref={ref}
      onPointerMove={onMove}
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-16"
      style={{
        background:
          "radial-gradient(600px circle at var(--hx, 70%) var(--hy, 30%), rgba(198,66,243,.13), transparent 60%)",
      }}
    >
      {/* grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #2a2239 1px, transparent 1px), linear-gradient(to bottom, #2a2239 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <motion.div style={{ y, opacity }} className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: d + 0.2, duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-ink-2/60 px-3.5 py-1.5 font-mono text-xs text-dim backdrop-blur"
          >
            <span className="live-dot h-2 w-2 rounded-full bg-brand-2" />
            {t.hero.badge}
          </motion.p>

          <h1 className="font-display text-[8.2vw] lg:text-[5vw] 2xl:text-[4.7rem] font-extrabold uppercase leading-[0.9] tracking-[-0.035em]">
            {[t.hero.line1, t.hero.line2].map((w, k) => (
              <span key={w} className="block overflow-hidden">
                <motion.span
                  className={`block ${k === 1 ? "text-outline" : ""}`}
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: d + k * 0.1, duration: 1, ease }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
            <span className="relative block h-[1em] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={words[i]}
                  className="text-gradient absolute start-0 top-0 block whitespace-nowrap"
                  initial={{ y: "100%", rotateX: -60, opacity: 0 }}
                  animate={{ y: 0, rotateX: 0, opacity: 1 }}
                  exit={{ y: "-100%", rotateX: 60, opacity: 0 }}
                  transition={{ duration: 0.7, ease }}
                >
                  {words[i]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: d + 0.4, duration: 0.8, ease }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-dim"
          >
            {t.hero.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: d + 0.55, duration: 0.8, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Magnetic>
              <Link
                href="/contact"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-brand px-7 py-4 font-semibold text-on-brand"
              >
                <span className="absolute inset-0 translate-y-full rounded-full bg-brand-2 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
                <span className="relative">{t.hero.cta}</span>
                <span className="flip-rtl relative transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link href="/work" className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-4 font-semibold transition-colors hover:border-paper/40">
                {t.hero.see}
              </Link>
            </Magnetic>
          </motion.div>
        </div>

        {/* 3D scene on desktop, layered screenshots everywhere else */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: d + 0.2, duration: 1.2, ease }}
          className="relative aspect-[4/3] [perspective:1200px] lg:aspect-square"
          aria-hidden
        >
          <div className="absolute inset-0 lg:-inset-x-20 lg:-inset-y-16">
            <Hero3D
              fallback={
                <motion.div style={{ rotateY: rotY, rotateX: rotX }} className="relative h-full w-full [transform-style:preserve-3d] lg:p-20">
                  <motion.div style={{ x: backX, y: backY }} className="absolute right-0 top-[6%] w-[80%] rotate-[5deg] overflow-hidden rounded-2xl border border-line shadow-[0_40px_100px_rgba(0,0,0,.6)]">
                    <Image src="/projects/ravo-og.webp" alt="" width={1200} height={630} priority className="h-auto w-full" />
                  </motion.div>
                  <motion.div style={{ x: frontX, y: frontY }} className="absolute bottom-[8%] left-0 w-[84%] -rotate-[4deg] overflow-hidden rounded-2xl border border-line shadow-[0_40px_100px_rgba(0,0,0,.7)]">
                    <Image src="/projects/ono.webp" alt="" width={1440} height={900} priority className="h-auto w-full" />
                  </motion.div>
                </motion.div>
              }
            />
          </div>
          <div className="pointer-events-none absolute -bottom-2 start-0 flex items-center gap-2 rounded-full border border-line bg-ink-2/90 px-4 py-2 font-mono text-xs backdrop-blur lg:-bottom-6">
            <span className="live-dot h-2 w-2 rounded-full bg-brand-2" /> {t.hero.shipped}
          </div>
        </motion.div>
      </motion.div>

      <motion.a
        href="#featured"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: d + 0.9 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-dim md:flex"
      >
        {t.hero.scroll}
        <span className="relative h-10 w-px overflow-hidden bg-line">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-brand"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </span>
      </motion.a>
    </section>
  );
}
