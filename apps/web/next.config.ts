import type { NextConfig } from "next";

function getOrigin(urlStr?: string): string | null {
  if (!urlStr) return null;
  try {
    return new URL(urlStr).origin;
  } catch {
    return null;
  }
}

const connectSources = Array.from(
  new Set(
    [
      "'self'",
      "https://*.stellar.org",
      "https://stellarcade-backend.onrender.com",
      "https://stellarcade-arbiter.onrender.com",
      "https://stellar.expert",
      "https://va.vercel-scripts.com",
      "https://vitals.vercel-insights.com",
      getOrigin(process.env.NEXT_PUBLIC_API_URL),
      getOrigin(process.env.NEXT_PUBLIC_API_BASE_URL),
      getOrigin(process.env.NEXT_PUBLIC_ARBITER_URL),
      getOrigin(process.env.NEXT_PUBLIC_SOROBAN_RPC_URL),
      getOrigin(process.env.NEXT_PUBLIC_HORIZON_URL),
    ].filter((item): item is string => Boolean(item))
  )
).join(" ");

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  `connect-src ${connectSources}`,
];

const contentSecurityPolicy = cspDirectives.join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
