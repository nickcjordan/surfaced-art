import type { NextConfig } from "next";

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
};

export default nextConfig;
