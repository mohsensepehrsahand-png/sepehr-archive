import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client'],
  // Restrict to localhost only
  serverRuntimeConfig: {
    hostname: 'localhost'
  }
};

export default nextConfig;
