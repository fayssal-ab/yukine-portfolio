import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  const allowedUsername = process.env.ADMIN_GITHUB_USERNAME?.trim().toLowerCase();
  if (
    session?.user?.githubLogin &&
    allowedUsername &&
    session.user.githubLogin.toLowerCase() === allowedUsername
  ) {
    return null;
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0].trim() ??
      request.headers.get("host") ??
      requestUrl.host;
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
    const protocol = forwardedProtocol
      ? forwardedProtocol.endsWith(":")
        ? forwardedProtocol
        : `${forwardedProtocol}:`
      : requestUrl.protocol;
    return originUrl.host.toLowerCase() === host.toLowerCase() && originUrl.protocol === protocol;
  } catch {
    return false;
  }
}

export async function rateLimitIdentifier(request: Request) {
  const address =
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-real-ip") ??
    (process.env.NODE_ENV !== "production"
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      : undefined);
  const secret = process.env.AUTH_SECRET;
  if (!address || !secret) throw new Error("Missing trusted client address or AUTH_SECRET");
  return createHmac("sha256", secret).update(address).digest("hex");
}
