"use client";

import { contact, getCases, navKeys } from "@/lib/data";
import Logo from "./Logo";
import DiscordButton from "./DiscordButton";
import { XIcon } from "./XButton";
import { Link, useT } from "./I18n";

export default function Footer() {
  const t = useT();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-10 pt-20 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo size={44} />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-dim">{t.footer.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={contact.x} target="_blank" rel="noopener" aria-label="X" className="grid h-12 w-12 place-items-center rounded-full border border-line transition-colors hover:border-paper/50">
              <XIcon className="h-4 w-4" />
            </a>
            <DiscordButton className="!py-3 text-sm" />
          </div>
        </div>

        <div>
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{t.footer.pages}</p>
          <ul className="space-y-3 text-sm">
            {navKeys.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-brand">
                  {t.nav[l.key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{t.footer.cases}</p>
          <ul className="space-y-3 text-sm">
            {getCases(t).map((c) => (
              <li key={c.slug}>
                <Link href={`/work/${c.slug}`} className="transition-colors hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{t.footer.elsewhere}</p>
          <ul className="space-y-3 text-sm">
            {contact.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener" className="transition-colors hover:text-brand">
                  {s.label} <span className="flip-rtl">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p
        aria-hidden
        dir="ltr"
        className="pointer-events-none select-none bg-gradient-to-b from-paper/[0.09] to-transparent bg-clip-text text-center font-display text-[13.5vw] font-extrabold uppercase leading-[0.78] tracking-[-0.05em] text-transparent xl:text-[11.5rem]"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Yukine
      </p>

      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-5 py-6 text-xs text-dim md:flex-row md:justify-between">
        <span>
          © {new Date().getFullYear()} YUKINE. {t.footer.rights}
        </span>
        <span>{t.footer.made}</span>
      </div>
    </footer>
  );
}
