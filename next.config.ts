import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['seasdata.cn'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
