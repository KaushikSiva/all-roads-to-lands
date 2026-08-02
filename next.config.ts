import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "www.jambase.com" },
      { protocol: "https", hostname: "*.jambase.com" },
    ],
  },
};

export default nextConfig;
