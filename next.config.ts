import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // NO incluyas 'turbopack' aquí. 
  // Next.js lo detecta automáticamente.
};

export default nextConfig;