import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/dlahfchej/**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Performans optimizasyonları
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Experimental optimizasyonlar
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },
  serverExternalPackages: ["iyzipay"],

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking koruması
          { key: 'X-Frame-Options', value: 'DENY' },
          // MIME sniffing koruması
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS koruması
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer politikası
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HTTPS zorunluluğu (1 yıl)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // İzin politikası
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
          // DNS Prefetch
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      // API routes için ek güvenlik
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;

export const config = {
  matcher: ["/admin/:path*", "/users/:path*"],
};