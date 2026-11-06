"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getProjects } from "@/lib/data";
import { useT } from "./I18n";
import { spotMove } from "./ui";

/** Other builds, filterable by kind. */
export default function ProjectGrid() {
  const t = useT();
  const projects = useMemo(() => getProjects(t), [t]);
  const all = t.work.all;
  const kinds = useMemo(() => [all, ...Array.from(new Set(projects.map((p) => p.kind)))], [projects, all]);
  const [kind, setKind] = useState(all);
  const list = kind === all ? projects : projects.filter((p) => p.kind === kind);

  return (
    <div>
      <div role="tablist" aria-label="Filter projects" className="mb-10 flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className="relative rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-paper/40"
          >
            {kind === k && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-paper" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className={`relative ${kind === k ? "text-ink" : "text-dim"}`}>{k}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p) => {
            const inner = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-dim">{p.meta}</p>
                  {p.href && (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-sm transition-all duration-300 group-hover:rotate-45 group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
                      ↗
                    </span>
                  )}
                </div>
                <p className="mt-8 font-mono text-[11px] text-brand-2">{p.kind}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{p.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-dim">{p.text}</p>
                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {p.stack.map((s) => (
                    <li key={s} className="rounded-full bg-ink-3 px-2.5 py-1 font-mono text-[10px] text-dim">
                      {s}
                    </li>
                  ))}
                </ul>
              </>
            );
            const cls = "spot group flex h-full flex-col rounded-3xl border border-line bg-ink-2 p-6 transition-transform duration-300 hover:-translate-y-1";
            return (
              <motion.div
                key={p.name}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
              >
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noopener" data-cursor={t.work.code} onPointerMove={spotMove} className={cls}>
                    {inner}
                  </a>
                ) : (
                  <div onPointerMove={spotMove} className={cls}>
                    {inner}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
