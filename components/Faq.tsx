"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useT } from "./I18n";

export default function Faq() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="border-t border-line">
      {t.faq.items.map((f, i) => {
        const on = open === i;
        return (
          <li key={f.q} className="border-b border-line">
            <button
              onClick={() => setOpen(on ? null : i)}
              aria-expanded={on}
              className="flex w-full items-center justify-between gap-6 py-6 text-start font-display text-xl font-bold md:text-2xl"
            >
              {f.q}
              <motion.span
                animate={{ rotate: on ? 45 : 0 }}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-lg ${on ? "border-brand bg-brand text-on-brand" : "border-line text-dim"}`}
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-6 text-dim">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
