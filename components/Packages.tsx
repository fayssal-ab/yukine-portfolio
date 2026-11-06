"use client";

import { Link, useT } from "./I18n";
import { motion } from "motion/react";
import { spotMove } from "./ui";

export default function Packages() {
  const t = useT();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {t.services.packages.map((p, i) => (
        <motion.article
          key={p.name}
          onPointerMove={spotMove}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`spot relative flex flex-col rounded-[28px] border p-8 ${
            i === 1 ? "border-brand/60 bg-[linear-gradient(160deg,rgba(198,66,243,.18),rgba(69,188,244,.06)_60%,transparent)]" : "border-line bg-ink-2"
          }`}
        >
          {i === 1 && (
            <span className="absolute end-6 top-6 rounded-full bg-brand px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-on-brand">{t.services.signature}</span>
          )}
          <p className="pe-20 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-2">{p.for}</p>
          <h3 className="mt-4 font-display text-xl font-extrabold uppercase md:text-2xl">{p.name}</h3>
          <p className="mt-3 text-dim">{p.text}</p>
          <ul className="mt-8 flex-1 space-y-3 border-t border-line pt-6 text-sm">
            {p.includes.map((x) => (
              <li key={x} className="flex gap-3">
                <span className="text-brand">✓</span>
                {x}
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold transition-colors ${
              i === 1 ? "bg-brand text-on-brand hover:bg-brand-2" : "border border-line hover:border-paper/40"
            }`}
          >
            {t.services.quote} <span className="flip-rtl">→</span>
          </Link>
        </motion.article>
      ))}
    </div>
  );
}
