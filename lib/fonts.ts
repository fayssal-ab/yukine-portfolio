import { Syne, Inter, JetBrains_Mono, Noto_Kufi_Arabic, IBM_Plex_Sans_Arabic } from "next/font/google";

// Latin scripts: Syne (display) + Inter (body), with accents (latin-ext).
const display = Syne({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700", "800"], variable: "--font-syne" });
const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jb" });
// Arabic: Noto Kufi Arabic for headings, IBM Plex Sans Arabic for text.
const arDisplay = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["500", "700", "800", "900"], variable: "--font-ar-display" });
const arBody = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600"], variable: "--font-ar-body" });

/** Class names that expose every site font as a CSS variable. */
export const fontVariables = [display, body, mono, arDisplay, arBody].map((f) => f.variable).join(" ");
