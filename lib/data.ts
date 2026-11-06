import type { Dict } from "./i18n/en";

// Language-neutral data: images, links, colours, tech. All wording lives in lib/i18n/*.

export type Shot = { src: string; w: number; h: number; alt: string };
type Img = Omit<Shot, "alt">;
type CaseSlug = keyof Dict["cases"];

export const site = { name: "YUKINE", url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" };

export const navKeys = [
  { href: "/", key: "home" },
  { href: "/work", key: "work" },
  { href: "/services", key: "services" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export const contact = {
  discord: "yuuukine",
  x: "https://x.com/yuuukine1",
  xHandle: "@yuuukine1",
  socials: [
    { label: "X", href: "https://x.com/yuuukine1" },
    { label: "GitHub", href: "https://github.com/fayssal-ab" },
    { label: "Instagram", href: "https://www.instagram.com/fay55al" },
    { label: "YouTube", href: "https://www.youtube.com/@yukine1" },
  ],
};

const caseMeta: {
  slug: CaseSlug;
  name: string;
  short: string;
  partner: string;
  year: string;
  accent: string;
  stack: string[];
  link: { href: string; label?: string; live: boolean };
  logo: string;
  gallery: Img[];
  main: number;
  sub: number;
}[] = [
  {
    slug: "ravo",
    name: "RAVONEVERSLEEPS",
    short: "RAVO",
    partner: "Qzino & Flush",
    year: "2026",
    accent: "#7dff4a",
    stack: ["Next.js 16", "React 19", "three.js", "Tailwind v4", "MySQL", "Zod", "Kick API", "Discord OAuth + bot", "Netlify"],
    link: { href: "https://ravorewards.org", label: "ravorewards.org", live: true },
    logo: "/projects/ravo-icon.png",
    gallery: [
      { src: "/projects/ravo-home.webp", w: 1440, h: 900 },
      { src: "/projects/ravo-leaderboard.webp", w: 1440, h: 900 },
      { src: "/projects/ravo-lb-table.webp", w: 1440, h: 900 },
      { src: "/projects/ravo-challenges.webp", w: 1440, h: 900 },
      { src: "/projects/ravo-admin.webp", w: 1440, h: 900 },
      { src: "/projects/ravo-admin-tournament.webp", w: 1440, h: 900 },
      { src: "/projects/ravo-admin-challenges.webp", w: 1440, h: 900 },
      { src: "/projects/ravo-og.webp", w: 1200, h: 630 },
    ],
    main: 0,
    sub: 1,
  },
  {
    slug: "ono",
    name: "ONO DEGEN TUNNEL",
    short: "ONO",
    partner: "Stake",
    year: "2026",
    accent: "#f5c14b",
    stack: ["Next.js 16", "TypeScript", "Tailwind v4", "MySQL", "Zod", "decimal.js", "Kick webhooks", "discord.py", "Netlify"],
    link: { href: "https://onodegentunnel.netlify.app", label: "onodegentunnel.netlify.app", live: true },
    logo: "/projects/ono-logo.webp",
    gallery: [
      { src: "/projects/ono.webp", w: 1440, h: 900 },
      { src: "/projects/ono-leaderboard.webp", w: 1440, h: 900 },
      { src: "/projects/ono-podium.webp", w: 1440, h: 900 },
      { src: "/projects/ono-table.webp", w: 1440, h: 900 },
      { src: "/projects/ono-admin.webp", w: 1440, h: 900 },
      { src: "/projects/ono-admin-periods.webp", w: 1440, h: 900 },
      { src: "/projects/ono-admin-settings.webp", w: 1440, h: 900 },
      { src: "/projects/ono-og.webp", w: 1200, h: 630 },
    ],
    main: 0,
    sub: 2,
  },
  {
    slug: "jballin",
    name: "JBALLIN Rewards",
    short: "JBALLIN",
    partner: "Rainbet",
    year: "2026",
    accent: "#34d399",
    stack: ["Next.js 16", "TypeScript", "Tailwind v4", "MySQL", "Rainbet API", "Shopify", "GitHub Actions"],
    link: { href: "https://github.com/fayssal-ab/JBALLIN-Rewards", live: false },
    logo: "/projects/jballin-logo.webp",
    gallery: [
      { src: "/projects/jballin.webp", w: 1440, h: 840 },
      { src: "/projects/jballin-lb.webp", w: 1440, h: 900 },
      { src: "/projects/jballin-podium.webp", w: 1440, h: 900 },
      { src: "/projects/jballin-store.webp", w: 1440, h: 900 },
      { src: "/projects/jballin-products.webp", w: 1440, h: 900 },
      { src: "/projects/jballin-admin-wheel.webp", w: 1440, h: 720 },
    ],
    main: 0,
    sub: 4,
  },
];

export type CaseStudy = ReturnType<typeof getCases>[number];

export function getCases(t: Dict) {
  return caseMeta.map((m) => {
    const tx = t.cases[m.slug];
    const gallery: Shot[] = m.gallery.map((g, i) => ({ ...g, alt: tx.gallery[i] ?? m.name }));
    return {
      ...m,
      ...tx,
      gallery,
      main: gallery[m.main],
      sub: gallery[m.sub],
      link: { ...m.link, label: m.link.label ?? t.caseUi.code + " · GitHub" },
    };
  });
}

export const caseSlugs = caseMeta.map((c) => c.slug);
export const caseShort = Object.fromEntries(caseMeta.map((c) => [c.slug, c.short])) as Record<string, string>;

const projectStacks: { stack: string[]; href?: string }[] = [
  { stack: ["React", "Flask", "MongoDB"], href: "https://github.com/fayssal-ab/badge-tracking-app" },
  { stack: ["React", "Flask", "JWT"], href: "https://github.com/fayssal-ab/capstone-judging" },
  { stack: ["Python", "PySide6", "MQTT", "ESP32"] },
  { stack: ["Python", "Whisper", "LLM tools"] },
  { stack: ["Python", "discord.py", "SQLite"] },
  { stack: ["MongoDB", "Express", "React", "Node"], href: "https://github.com/fayssal-ab/university_app_web" },
  { stack: ["Laravel 11", "MySQL", "Bootstrap"], href: "https://github.com/fayssal-ab/security-app-LARAVEL-VITE" },
  { stack: ["Django", "Python"], href: "https://github.com/fayssal-ab/DJANGO_COVOITURAGE" },
  { stack: ["HTML", "CSS", "JavaScript"], href: "https://github.com/fayssal-ab/Mega-Facture" },
];

export const getProjects = (t: Dict) => t.projects.map((p, i) => ({ ...p, ...projectStacks[i] }));

export const stack = [
  "Next.js", "React", "TypeScript", "Node.js", "Tailwind", "three.js", "Python", "Flask", "Django",
  "Laravel", ".NET", "Java", "MySQL", "MongoDB", "Docker", "Netlify", "Vercel", "GitHub Actions",
  "Discord API", "Kick API",
];
