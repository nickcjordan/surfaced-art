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
  async redirects() {
    return [
      // Old 9-category URLs → new 4-category URLs (permanent redirects)
      { source: "/category/painting", destination: "/category/drawing-painting", permanent: true },
      { source: "/category/illustration", destination: "/category/drawing-painting", permanent: true },
      { source: "/category/print", destination: "/category/printmaking-photography", permanent: true },
      { source: "/category/photography", destination: "/category/printmaking-photography", permanent: true },
      { source: "/category/jewelry", destination: "/category/mixed-media-3d", permanent: true },
      { source: "/category/woodworking", destination: "/category/mixed-media-3d", permanent: true },
      { source: "/category/fibers", destination: "/category/mixed-media-3d", permanent: true },
      { source: "/category/mixed_media", destination: "/category/mixed-media-3d", permanent: true },
      // Old underscore URLs → new hyphenated URLs
      { source: "/category/drawing_painting", destination: "/category/drawing-painting", permanent: true },
      { source: "/category/printmaking_photography", destination: "/category/printmaking-photography", permanent: true },
      { source: "/category/mixed_media_3d", destination: "/category/mixed-media-3d", permanent: true },
    ];
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
