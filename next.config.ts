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
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.dsmcdn.com",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 768, 1024, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85],
    minimumCacheTTL: 3600,
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
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sandbox-api.iyzipay.com https://checkout.iyzipay.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' blob: data: res.cloudinary.com images.unsplash.com plus.unsplash.com images.pexels.com cdn.dsmcdn.com https://*.iyzipay.com;",
              "font-src 'self' https://fonts.gstatic.com;",
              "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com https://*.iyzipay.com https://api.upstash.com;",
              "frame-src 'self' https://sandbox-secure.iyzipay.com https://secure.iyzipay.com;",
              "media-src 'self' https://res.cloudinary.com;",
              "object-src 'none';",
              "upgrade-insecure-requests;"
            ].join(' ')
          },
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