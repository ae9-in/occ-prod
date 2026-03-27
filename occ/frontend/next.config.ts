import type { NextConfig } from "next";

function resolveApiOrigin() {
  const fallback = "http://localhost:5000";
  const raw = (process.env.NEXT_PUBLIC_API_URL || fallback).trim();

  try {
    if (/^postgres(ql)?:\/\//i.test(raw)) {
      return fallback;
    }

    const normalized = raw.endsWith("/api/v1")
      ? raw.slice(0, -7)
      : raw.endsWith("/api")
        ? raw.slice(0, -4)
        : raw;
    return new URL(normalized).origin;
  } catch {
    return fallback;
  }
}

const apiOrigin = resolveApiOrigin();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              `connect-src 'self' ${apiOrigin}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join("; ")
          },
        ],
      },
    ];
  },
};

export default nextConfig;
