import type { NextConfig } from "next";

// Get allowed origins from environment variable or use default
const getAllowedDevOrigins = (): string[] | undefined => {
  if (process.env.NODE_ENV !== 'development') {
    return undefined;
  }
  
  // Allow IP from environment variable or use the detected IP
  const allowedOrigins = process.env.ALLOWED_DEV_ORIGINS 
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(origin => origin.trim())
    : ['93.127.160.182']; // Default IP from your logs
  
  return allowedOrigins.length > 0 ? allowedOrigins : undefined;
};

const nextConfig: NextConfig = {
  // Configure allowed dev origins to suppress cross-origin warnings
  // Set ALLOWED_DEV_ORIGINS environment variable to override (comma-separated)
  allowedDevOrigins: getAllowedDevOrigins(),
  
  // Optimize Fast Refresh
  reactStrictMode: true,
  
  // Production optimizations
  compress: true,
  
  // Security headers (optional but recommended)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
