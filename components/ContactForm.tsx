"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DiscordIcon } from "./DiscordButton";
import { useLang, useT } from "./I18n";

type Status = { kind: "idle" | "sending" | "sent" | "error"; msg?: string };

const field =
  "peer w-full border-b border-line bg-transparent pb-3 pt-6 text-lg text-paper outline-none transition-colors placeholder:text-transparent focus:border-brand";
const label =
  "pointer-events-none absolute start-0 top-6 text-lg text-dim transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-focus:text-brand peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs";

/** Name, how to reach you, message. That's it. */
export default function ContactForm() {
  const t = useT();
  const c = t.contact;
  const lang = useLang();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) throw new Error(res.status === 400 ? c.errInvalid : res.status === 429 ? c.errLimit : c.errDown);
      form.reset();
      setStatus({ kind: "sent" });
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error && err.message.length < 120 && !err.message.includes("fetch") ? err.message : c.errDown });
    }
  }

  return (
    <div className="relative rounded-[28px] border border-line bg-ink-2/70 p-6 backdrop-blur-xl md:p-10">
      <AnimatePresence mode="wait">
        {status.kind === "sent" ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex min-h-[320px] flex-col items-start justify-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-2xl text-on-brand">✓</span>
            <h3 className="mt-6 font-display text-3xl font-bold">{c.sentTitle}</h3>
            <p className="mt-3 max-w-sm text-dim">{c.sentText}</p>
            <button onClick={() => setStatus({ kind: "idle" })} className="mt-8 text-sm text-dim underline underline-offset-4 hover:text-paper">
              {c.again}
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-7">
            <div className="grid gap-7 md:grid-cols-2">
              <div className="relative">
                <input id="name" name="name" required minLength={2} maxLength={80} placeholder={c.name} className={field} autoComplete="name" />
                <label htmlFor="name" className={label}>{c.name}</label>
              </div>
              <div className="relative">
                <input id="contact" name="contact" required minLength={3} maxLength={120} placeholder={c.reach} className={field} />
                <label htmlFor="contact" className={label}>{c.reach}</label>
              </div>
            </div>
            <div className="relative">
              <textarea id="message" name="message" required minLength={10} maxLength={1800} rows={4} placeholder={c.message} className={`${field} resize-none`} />
              <label htmlFor="message" className={label}>{c.message}</label>
            </div>
            <input type="hidden" name="lang" value={lang} />
            {/* honeypot */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-sm text-dim" aria-live="polite">
                {status.kind === "error" ? (
                  <span className="text-red-400">{status.msg}</span>
                ) : (
                  <>
                    <DiscordIcon className="h-3.5 w-[18px]" />
                    {c.note}
                  </>
                )}
              </p>
              <button
                type="submit"
                disabled={status.kind === "sending"}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-brand px-8 py-4 font-semibold text-on-brand disabled:opacity-60"
              >
                <span className="absolute inset-0 translate-y-full rounded-full bg-paper transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
                <span className="relative">{status.kind === "sending" ? c.sending : c.send}</span>
                <span className="flip-rtl relative transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
