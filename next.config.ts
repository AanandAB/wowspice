import type { NextConfig } from "next";

// GitHub Pages serves a project site at /<repo>, so every absolute URL — routes,
// Next's own /_next chunks, and the product images referenced in data — must be
// prefixed. Local dev leaves this empty and runs at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export: the whole storefront is client-side (browser-only orders,
  // no payment, no server state), so it ships as plain files for GitHub Pages
  // or any static host. `next dev` still runs normally; only `next build`
  // produces the `out/` directory.
  output: "export",
  ...(basePath ? { basePath } : {}),
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;
