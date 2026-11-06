import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";
import DiscordButton, { DiscordIcon } from "@/components/DiscordButton";
import { XIcon } from "@/components/XButton";
import { contact } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = getDict((await params).lang as Locale);
  return { title: t.nav.contact, description: t.contact.intro };
}

export default async function ContactPage({ params }: P) {
  const t = getDict((await params).lang as Locale);
  const c = t.contact;
  return (
    <>
      <PageHeader eyebrow={c.eyebrow} shape="mascot-wave" compact title={[c.title[0], <span key="y" className="text-gradient">{c.title[1]}</span>]} intro={c.intro} />
      <section className="relative pb-32 pt-2">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 lg:grid-cols-[1.5fr_1fr]">
          <ContactForm />
          <div className="grid content-start gap-6">
            <a href={contact.x} target="_blank" rel="noopener" className="group relative flex flex-col overflow-hidden rounded-[28px] bg-paper p-8 text-ink">
              <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-brand to-brand-2 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
              <span className="relative flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em]">
                {c.fastest} <XIcon className="h-5 w-5" />
              </span>
              <span className="relative mt-12 flex items-end justify-between gap-4">
                <span className="min-w-0">
                  <span className="block font-display text-[clamp(1.6rem,6vw,2.25rem)] font-extrabold uppercase leading-none">{c.dmX}</span>
                  <span className="mt-2 block font-mono text-sm" dir="ltr">{contact.xHandle}</span>
                </span>
                <span className="flip-rtl text-4xl transition-transform duration-300 group-hover:-translate-y-1">↗</span>
              </span>
            </a>
            <div className="rounded-[28px] border border-line bg-ink-2/70 p-8">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-dim">
                <DiscordIcon className="h-3.5 w-4" /> {c.discord}
              </p>
              <p className="mt-4 text-dim">{c.discordText}</p>
              <DiscordButton variant="solid" className="mt-6 w-full justify-center" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
