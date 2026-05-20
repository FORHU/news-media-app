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
  reactCompiler: true,
  output: 'standalone',
  // Expose source maps in production builds — fixes Lighthouse "Missing source maps" audit
  productionBrowserSourceMaps: true,
  allowedDevOrigins: ["voicejeju.com", "jejuqq.com", "jejujapan.com", "jejutime.com", "skyblueprime.com"],
  // Turbopack on Windows can panic (os error 80) when creating junctions into native/Prisma deps.
  serverExternalPackages: [
    "pg",
    "@prisma/adapter-pg",
    "@prisma/client",
    "prisma",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
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