import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type checking runs separately via `npm run type-check`
    ignoreBuildErrors: true,
  },
  eslint: {
    // Linting runs separately via `npm run lint`
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
