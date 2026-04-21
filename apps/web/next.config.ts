import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build to a static site (apps/web/out) — deployed to Cloudflare Pages as
  // pure static assets. No server runtime. To move back to SSR later (e.g. for
  // a dashboard surface), remove output:'export' and deploy via
  // @opennextjs/cloudflare or a Node/Edge target.
  output: "export",

  // Static export can't run the next/image optimizer at request time.
  // We don't use remote images on marketing pages today; if that changes,
  // switch to a build-time optimizer or an external CDN.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
