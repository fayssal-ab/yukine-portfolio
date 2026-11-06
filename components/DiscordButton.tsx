"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { contact } from "@/lib/data";
import { useT } from "./I18n";

export function DiscordIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 71 55" fill="currentColor" aria-hidden className={className}>
      <path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.4a40 40 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A40 40 0 0 0 25.8.4 58.4 58.4 0 0 0 11.3 4.9C2.1 18.6-.4 32 .8 45.2a58.9 58.9 0 0 0 18 9.1 43 43 0 0 0 3.8-6.2 38 38 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 35.9 0l1.5 1.1a38 38 0 0 1-6 2.9 43 43 0 0 0 3.8 6.2 58.7 58.7 0 0 0 18-9.1c1.5-15.3-2.5-28.6-10.5-40.3ZM23.7 37.1c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 4-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 4-2.8 7.2-6.4 7.2Z" />
    </svg>
  );
}

/** Copies the Discord username; there's no public link to a profile by username alone. */
export default function DiscordButton({ variant = "ghost", className = "" }: { variant?: "ghost" | "solid"; className?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.discord);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = contact.discord;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const base =
    variant === "solid"
      ? "bg-[#5865F2] text-white hover:bg-[#4752c4]"
      : "border border-line bg-ink-2/70 text-paper backdrop-blur hover:border-[#5865F2]";

  return (
    <button onClick={copy} className={`relative inline-flex items-center gap-3 rounded-full px-6 py-4 font-semibold transition-colors ${base} ${className}`}>
      <DiscordIcon className="h-4 w-5" />
      <span className="relative inline-grid overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={String(copied)}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {copied ? t.discord.copied : contact.discord}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
