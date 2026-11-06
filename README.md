# YUKINE — portfolio

Next.js 16 · React 19 · Tailwind v4 · Motion · Lenis · three.js (React Three Fiber + drei)

## Run

```bash
npm install
cp .env.example .env.local   # add your Discord webhook
npm run dev                  # http://localhost:3000
```

Low on RAM? Build once and serve the build instead of `dev`:

```bash
npm run build && npm start
```

## Contact form → Discord

Messages from the form go to `/api/contact`, which posts them to a Discord channel.

1. In your Discord server: **Server Settings → Integrations → Webhooks → New Webhook**, pick a private channel, copy the URL.
2. Put it in `.env.local` (and in your host's environment variables): `DISCORD_WEBHOOK_URL=...`
3. Optional: `DISCORD_PING_USER_ID=<your user id>` so every message pings you and your phone buzzes.

Without the webhook, the form tells visitors to DM @yuuukine1 on X instead.

## Deploy

Netlify or Vercel: import the repo, add `DISCORD_WEBHOOK_URL`, deploy. No database needed.

## Pages

`/` home · `/work` all work · `/work/[slug]` case study with a screenshot album · `/services` · `/about` · `/contact`

## Edit content

All text, projects, albums, services, packages, FAQ and links live in `lib/data.ts`. Screenshots are in `public/projects/`.
Leaderboard and store screenshots were taken with sample data (the case pages say so).

If you replace a screenshot, give it a **new file name**: Next.js caches optimized images by URL for hours.
