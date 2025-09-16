import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client'],
  // Restrict to localhost only
  serverRuntimeConfig: {
    hostname: 'localhost'
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Enable static optimization
  trailingSlash: false,
  // Bundle analyzer (uncomment for debugging)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     };
  //   }
  //   return config;
  // },
};

export default nextConfig;
