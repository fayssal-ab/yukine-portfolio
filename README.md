# YUKINE — portfolio

Next.js 16 · React 19 · Tailwind v4 · Motion · Lenis · three.js (React Three Fiber + drei)

## Run

```bash
npm install
npm run dev                  # http://localhost:3000
```

Set local environment variables in the ignored `.env.local` file before using the contact form or admin dashboard. Never commit it.

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

## Private dashboard

The admin area is not linked from public pages. Open `/login` or `/admin` directly and sign in with the authorized GitHub account (`fayssal-ab`). Other GitHub accounts are denied.

The dashboard includes anonymous page-view and successful contact-request totals, plus private to-do and notes lists. It stores page paths and timestamps only; visitor IPs are HMAC-hashed only for rate limiting, and those short-lived hashes are removed after one day. Contact message contents are not stored in the dashboard.

The contact form allows **3 valid messages per IP per 10 minutes**. The limit is shared across serverless instances using Aiven MySQL, rather than relying on per-process memory.

### Required environment variables

Configure these for both local use and the deployed Netlify site:

- `AUTH_SECRET` — a long random secret (for example, generate one with `openssl rand -base64 32`).
- `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` — GitHub OAuth App credentials. Set its callback URL to `https://<your-site-domain>/api/auth/callback/github`.
- `ADMIN_GITHUB_USERNAME=fayssal-ab` — the only GitHub account allowed into the admin area.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` — Aiven MySQL connection settings.
- `DB_SSL_CA` — Aiven CA certificate contents for deployment. Locally, `DB_SSL_CA_PATH` may point to a downloaded CA file instead.
- `DISCORD_WEBHOOK_URL` — the contact destination webhook. Keep it secret.
- `DISCORD_PING_USER_ID` — optional Discord user ID to mention after a successful contact request.

The app creates only tables prefixed `portfolio_` and does not alter the Discord bot's tables. After setting environment variables in Netlify, redeploy the site.

## Pages

`/` home · `/work` all work · `/work/[slug]` case study with a screenshot album · `/services` · `/about` · `/contact`

## Edit content

All text, projects, albums, services, packages, FAQ and links live in `lib/data.ts`. Screenshots are in `public/projects/`.
Leaderboard and store screenshots were taken with sample data (the case pages say so).

If you replace a screenshot, give it a **new file name**: Next.js caches optimized images by URL for hours.
