"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { contact, navKeys } from "@/lib/data";
import { localeInfo, locales, stripLocale, withLocale, type Locale } from "@/lib/i18n/config";
import Logo from "./Logo";
import DiscordButton from "./DiscordButton";
import { getLenis } from "./SmoothScroll";
import { Link, useLang, useT } from "./I18n";

const ease = [0.76, 0, 0.24, 1] as const;

function LangSwitch({ path, compact = false }: { path: string; compact?: boolean }) {
  const lang = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const choose = (l: Locale) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    // full navigation: the whole document changes language and direction
    window.location.href = withLocale(l, path);
  };

  if (compact)
    return (
      <div className="grid grid-cols-2 gap-2">
        {locales.map((l) => (
          <button
            key={l}
            onClick={() => choose(l)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-sm ${l === lang ? "border-brand bg-brand/15 text-paper" : "border-line text-dim"}`}
          >
            <span aria-hidden>{localeInfo[l].flag}</span>
            {localeInfo[l].name}
          </button>
        ))}
      </div>
    );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t.nav.language}
        className="flex h-11 items-center gap-2 rounded-full border border-line bg-ink-2/70 px-3.5 text-sm font-semibold transition-colors hover:border-paper/40"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
        </svg>
        {localeInfo[lang].short}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute end-0 top-full mt-2 w-60 origin-top overflow-hidden rounded-2xl border border-line bg-ink-2/95 p-1.5 shadow-[0_30px_80px_rgba(0,0,0,.6)] backdrop-blur-xl"
          >
            {locales.map((l) => (
              <li key={l}>
                <button
                  onClick={() => choose(l)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition-colors ${l === lang ? "bg-brand/15 text-paper" : "text-dim hover:bg-ink-3 hover:text-paper"}`}
                >
                  <span aria-hidden className="text-base">{localeInfo[l].flag}</span>
                  <span className="flex-1">{localeInfo[l].name}</span>
                  {l === lang && <span className="h-1.5 w-1.5 rounded-full bg-brand-2" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Nav() {
  const t = useT();
  const full = usePathname();
  const path = stripLocale(full);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(!open && v > prev && v > 300);
    setSolid(v > 30);
  });

  useEffect(() => setOpen(false), [full]);

  useEffect(() => {
    const l = getLenis();
    if (open) {
      l?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      l?.start();
      document.documentElement.style.overflow = "";
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-[70] px-3 pt-3 md:px-5 md:pt-4"
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav
          aria-label="Main"
          className={`mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 rounded-2xl border px-3 transition-[background-color,border-color] duration-300 md:px-4 ${
            solid || open ? "border-line bg-ink/75 backdrop-blur-xl" : "border-transparent"
          }`}
        >
          <Link href="/" aria-label="YUKINE" className="shrink-0 rounded-full">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-1 rounded-full border border-line bg-ink-2/60 p-1 backdrop-blur lg:flex">
            {navKeys.slice(1).map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href} className="relative">
                  {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-paper" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "text-ink" : "text-dim hover:text-paper"}`}
                  >
                    {t.nav[l.key]}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LangSwitch path={path} />
            </div>
            <Link
              href="/contact"
              className="group relative hidden items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand xl:inline-flex"
            >
              <span className="absolute inset-0 translate-y-full bg-brand-2 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
              <span className="relative">{t.nav.start}</span>
              <span className="flip-rtl relative">→</span>
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.close : t.nav.open}
              className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-ink-2/70 lg:hidden"
            >
              <span className={`absolute h-[1.5px] w-5 bg-paper transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
              <span className={`absolute h-[1.5px] w-5 bg-paper transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            data-lenis-prevent
            className="fixed inset-0 z-[65] flex flex-col overflow-y-auto bg-ink px-6 pb-8 pt-28 lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease }}
          >
            <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(198,66,243,.25),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(69,188,244,.18),transparent_55%)]" />
            <ul className="relative flex flex-col">
              {navKeys.map((l, i) => (
                <li key={l.href} className="overflow-hidden border-b border-line/60">
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                    <Link
                      href={l.href}
                      className={`flex items-center gap-4 py-4 font-display text-[clamp(1.25rem,6.2vw,2.4rem)] font-extrabold uppercase leading-tight ${isActive(l.href) ? "text-brand" : "text-paper"}`}
                    >
                      <span className="w-6 shrink-0 font-mono text-xs font-normal text-dim">0{i + 1}</span>
                      <span className="min-w-0 flex-1 [hyphens:auto]">{t.nav[l.key]}</span>
                      <span className="flip-rtl text-xl text-dim">→</span>
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="relative mt-8 flex flex-col gap-6">
              <div>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">{t.nav.language}</p>
                <LangSwitch path={path} compact />
              </div>
              <DiscordButton variant="solid" className="w-full justify-center" />
              <ul className="flex flex-wrap gap-6 text-sm text-dim">
                {contact.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
