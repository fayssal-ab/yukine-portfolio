"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { contact } from "@/lib/data";
import { stripLocale } from "@/lib/i18n/config";
import { XIcon } from "./XButton";
import { DiscordIcon } from "./DiscordButton";
import { Link, useT } from "./I18n";

/** Floating "Let's talk" button on every page: X, Discord or the form, one tap away. */
export default function ContactDock() {
  const t = useT();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), 2200);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (stripLocale(path) === "/contact") return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.discord);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 end-4 z-[60] flex flex-col items-end gap-3 md:bottom-6 md:end-6">
      <AnimatePresence>
        {open && (
          <motion.div
            id="contact-dock"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-[300px] origin-bottom rounded-3xl border border-line bg-ink-2/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,.6)] backdrop-blur-xl"
          >
            <p className="font-display text-lg font-bold">{t.dock.title}</p>
            <p className="mt-1 text-sm text-dim">{t.dock.text}</p>
            <div className="mt-5 grid gap-2">
              <a href={contact.x} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3 font-semibold text-ink transition-transform hover:-translate-y-0.5">
                <XIcon className="h-4 w-4" />
                <span dir="ltr">{contact.xHandle}</span>
                <span className="ms-auto flip-rtl">↗</span>
              </a>
              <button onClick={copy} className="flex items-center gap-3 rounded-2xl bg-[#5865F2] px-4 py-3 text-start font-semibold text-white transition-transform hover:-translate-y-0.5">
                <DiscordIcon className="h-3.5 w-4" /> {copied ? t.discord.copied : contact.discord}
                <span className="ms-auto text-xs opacity-70">{copied ? "" : t.discord.copy}</span>
              </button>
              <Link href="/contact" className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 font-semibold transition-colors hover:border-brand">
                ✉ {t.dock.brief} <span className="ms-auto flip-rtl">→</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {show && (
          <motion.button
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="contact-dock"
            className="group flex items-center gap-3 rounded-full border border-brand/40 bg-ink-2/90 py-1.5 pe-5 ps-1.5 shadow-[0_10px_40px_rgba(198,66,243,.35)] backdrop-blur-xl"
          >
            <span className="relative">
              <Image src="/logo.webp" alt="" width={40} height={40} className="rounded-full" />
              <span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-ink-2 bg-brand-2" />
            </span>
            <span className="text-sm font-semibold">{open ? t.dock.close : t.dock.button}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
