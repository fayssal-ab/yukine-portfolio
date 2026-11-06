"use client";

import { Shape3D } from "@/components/three/Lazy3D";
import { Link, useT } from "@/components/I18n";

export default function NotFound() {
  const t = useT().notFound;
  return (
    <section className="relative flex min-h-[90svh] items-center overflow-hidden pt-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-80 md:start-1/3">
        <Shape3D kind="mascot-lost" />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-5">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-2">{t.eyebrow}</p>
        <h1 className="mt-6 font-display text-[clamp(3rem,13vw,10rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em]">
          {t.title[0]}
          <br />
          <span className="text-gradient">{t.title[1]}</span>
        </h1>
        <p className="mt-8 max-w-md text-lg text-dim">{t.text}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-brand px-7 py-4 font-semibold text-on-brand transition-colors hover:bg-brand-2">
            {t.home}
          </Link>
          <Link href="/work" className="rounded-full border border-line px-7 py-4 font-semibold transition-colors hover:border-paper/40">
            {t.work}
          </Link>
        </div>
      </div>
    </section>
  );
}
