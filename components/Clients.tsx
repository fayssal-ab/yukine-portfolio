"use client";

import Image from "next/image";
import { Link, useT } from "./I18n";
import { getCases } from "@/lib/data";

export default function Clients() {
  const t = useT();
  return (
    <section aria-label="Clients" className="relative border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-dim">{t.clients.label}</p>
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-5">
          {getCases(t).map((c) => (
            <li key={c.slug}>
              <Link href={`/work/${c.slug}`} className="group flex items-center gap-3 opacity-70 transition-opacity hover:opacity-100">
                <Image
                  src={c.logo}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-xl object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
                />
                <span className="font-display text-sm font-bold uppercase tracking-wide">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
