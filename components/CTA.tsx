"use client";

import { Link, useT } from "./I18n";
import { RevealText } from "./ui";
import { Shape3D } from "./three/Lazy3D";
import type { ShapeKind } from "./three/ShapeScene";
import XButton from "./XButton";
import DiscordButton from "./DiscordButton";

/** Closing call to action used at the bottom of every page. */
export default function CTA({ shape = "knot" }: { shape?: ShapeKind }) {
  const t = useT();
  return (
    <section className="relative overflow-hidden border-t border-line py-28 md:py-40">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%] bg-[radial-gradient(ellipse_at_30%_100%,rgba(198,66,243,.25),transparent_60%),radial-gradient(ellipse_at_80%_90%,rgba(69,188,244,.15),transparent_55%)]" />
      <div aria-hidden className="pointer-events-none absolute -end-[10%] top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 md:block lg:end-[2%]">
        <Shape3D kind={shape} />
      </div>
      <div className="relative mx-auto max-w-7xl px-5">
        <p className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-dim">
          <span className="live-dot h-2 w-2 rounded-full bg-brand-2" /> {t.cta.booking}
        </p>
        <h2 className="max-w-6xl font-display text-[clamp(1.1rem,4.8vw,3.8rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]">
          <RevealText lines={[t.cta.title[0], t.cta.title[1], <span key="b" className="text-gradient">{t.cta.title[2]}</span>]} />
        </h2>
        <p className="mt-8 max-w-lg text-lg text-dim">{t.cta.text}</p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/contact"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-brand px-7 py-4 font-semibold text-on-brand"
          >
            <span className="absolute inset-0 translate-y-full bg-brand-2 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
            <span className="relative">{t.cta.start}</span>
            <span className="relative transition-transform duration-300 group-hover:translate-x-1 flip-rtl">→</span>
          </Link>
          <XButton />
          <DiscordButton />
        </div>
      </div>
    </section>
  );
}
