import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking via iframes
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Control referrer information sent with requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser feature access
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Prevent cross-origin window attacks; allow-popups keeps OAuth/ad windows working
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // HSTS: ignored on HTTP (localhost), enforced on HTTPS (production) — 2 year max-age
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Disable React Compiler in dev — it recompiles components on every change
  // and the resulting module updates can't always be hot-applied, causing
  // full-page HMR reloads. Re-enabled in production where HMR is inactive.
  reactCompiler: process.env.NODE_ENV === 'production',
  output: 'standalone',
  // Expose source maps in production builds — fixes Lighthouse "Missing source maps" audit
  productionBrowserSourceMaps: true,
  allowedDevOrigins: ["newsicons.com", "lavaguetech.com", "voicejeju.com", "jejuqq.com", "jejujapan.com", "jejutime.com", "skyblueprime.com"],
  // Turbopack on Windows can panic (os error 80) when creating junctions into native/Prisma deps.
  serverExternalPackages: [
    "pg",
    "@prisma/adapter-pg",
    "@prisma/client",
    "prisma",
  ],

  // Turbopack is the default bundler in Next.js 16.
  // Declaring it here silences the "webpack config but no turbopack config" warning.
  // Turbopack handles WASM files natively without the full-page HMR reload issue
  // that webpack's experimental async-WASM caused with src/generated/prisma/.
  turbopack: {},

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    // Default localPatterns (pathname: '**', search: '') blocks any local image
    // with a query string. /api/admin/proxy-image needs its `url` query param,
    // so it gets its own entry; the catch-all preserves the previous default
    // for every other local image (logos, icons, favicons).
    localPatterns: [
      { pathname: '**', search: '' },
      { pathname: '/api/admin/proxy-image' },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;