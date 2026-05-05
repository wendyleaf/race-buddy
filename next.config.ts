import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Race images come from arbitrary marathon websites we discover
    // dynamically, so we allow any HTTPS host. Next.js still proxies
    // them through the optimizer.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
