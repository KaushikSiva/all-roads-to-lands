import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.jambase.com" },
      { protocol: "https", hostname: "*.jambase.com" },
    ],
  },
};

export default nextConfig;
