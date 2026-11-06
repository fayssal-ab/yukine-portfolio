"use client";

import { contact } from "@/lib/data";
import { useT } from "./I18n";

export function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export default function XButton({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <a
      href={contact.x}
      target="_blank"
      rel="noopener"
      className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-paper px-6 py-4 font-semibold text-ink ${className}`}
    >
      <span className="absolute inset-0 translate-y-full bg-gradient-to-r from-brand to-brand-2 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
      <XIcon className="relative h-4 w-4" />
      <span className="relative" dir="ltr">{t.dock.dm} {contact.xHandle}</span>
    </a>
  );
}
