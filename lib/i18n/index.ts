import type { Locale } from "./config";
import { en, type Dict } from "./en";
import { fr } from "./fr";
import { ar } from "./ar";
import { de } from "./de";
import { es } from "./es";
import { esAr } from "./es-ar";
import { ptBr } from "./pt-br";

const dicts: Record<Locale, Dict> = { en, fr, ar, de, es, "es-ar": esAr, "pt-br": ptBr };

export const getDict = (lang: Locale): Dict => dicts[lang] ?? en;
export type { Dict };
