import type { NextConfig } from "next";

// Canonical public origin, fixed at build time. Netlify sets URL to the main
// site address (never the per-deploy permalink); AUTH_URL wins if set.
const siteUrl =
  process.env.AUTH_URL ||
  (process.env.CONTEXT === "production" ? process.env.URL : "") ||
  "";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  env: { CANONICAL_SITE_URL: siteUrl },
};

export default nextConfig;
