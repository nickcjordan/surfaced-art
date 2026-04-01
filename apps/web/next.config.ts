import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { SECURITY_HEADERS } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dmfu4c7s6z2cc.cloudfront.net", // prod CDN
      },
      {
        protocol: "https",
        hostname: "d2agn4aoo0e7ji.cloudfront.net", // dev CDN
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "surfaced-art",
  project: "frontend",

  authToken: process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  // Proxy route to bypass ad-blockers
  tunnelRoute: "/monitoring",

  silent: !process.env.CI,
});
