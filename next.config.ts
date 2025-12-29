import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Turbopack configuration (Next.js 16+)
  turbopack: {
    // Empty config to acknowledge we're using Turbopack
    // and silence the webpack warning
  },
  
  webpack: (config, { isServer }) => {
    // Suppress big string serialization warnings in development
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
};

export default nextConfig;

