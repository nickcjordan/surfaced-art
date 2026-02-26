import type { NextConfig } from "next";
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

export default nextConfig;
