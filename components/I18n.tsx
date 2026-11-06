"use client";

import { createContext, useContext, type ComponentProps } from "react";
import NextLink from "next/link";
import type { Dict } from "@/lib/i18n/en";
import { defaultLocale, withLocale, type Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/en";

const Ctx = createContext<{ lang: Locale; t: Dict }>({ lang: defaultLocale, t: en });

export function I18nProvider({ lang, t, children }: { lang: Locale; t: Dict; children: React.ReactNode }) {
  return <Ctx.Provider value={{ lang, t }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx).t;
export const useLang = () => useContext(Ctx).lang;

/** next/link that keeps the visitor in their language. */
export function Link({ href, ...props }: ComponentProps<typeof NextLink> & { href: string }) {
  const lang = useLang();
  return <NextLink href={withLocale(lang, href)} {...props} />;
}
