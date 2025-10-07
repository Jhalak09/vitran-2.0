import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // This will allow your project to build even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;