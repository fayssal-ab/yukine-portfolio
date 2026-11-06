import { NextResponse } from "next/server";

// Sends each project request straight to a Discord channel through a webhook.
// Env: DISCORD_WEBHOOK_URL (required), DISCORD_PING_USER_ID (optional, pings you so the phone buzzes).

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 4;
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
// keep user text from breaking out of the embed or faking mentions
const safe = (v: string) => v.replace(/@/g, "@​").replace(/`/g, "'");

export async function POST(req: Request) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({ error: "The contact form isn't connected yet. Please DM @yuuukine1 on X for now." }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many messages. Please wait a few minutes and try again." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // bots fill every field, people never see this one
  if (text(body.website, 200)) return NextResponse.json({ ok: true });

  const name = text(body.name, 80);
  const reach = text(body.contact, 120);
  const message = text(body.message, 1800);

  if (name.length < 2 || reach.length < 3 || message.length < 10) {
    return NextResponse.json({ error: "Please add your name, how to reach you, and a few words about the project." }, { status: 400 });
  }

  const ping = process.env.DISCORD_PING_USER_ID?.trim();
  const payload = {
    username: "YUKINE · Portfolio",
    content: ping ? `<@${ping}> new project request` : "New project request",
    allowed_mentions: { users: ping ? [ping] : [] },
    embeds: [
      {
        title: `New request · ${safe(name)}`,
        description: safe(message),
        color: 0xc642f3,
        fields: [
          { name: "Contact", value: safe(reach), inline: true },
          { name: "Language", value: safe(text(body.lang, 10)) || "?", inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`Discord answered ${res.status}`);
  } catch (err) {
    console.error("[contact] webhook failed:", err);
    return NextResponse.json({ error: "Couldn't send right now. Please DM @yuuukine1 on X instead." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
