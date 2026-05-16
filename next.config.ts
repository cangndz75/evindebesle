import { withSentryConfig } from "@sentry/nextjs";

const ciDistDir = process.env.NEXT_DIST_DIR?.trim();

const nextConfig = {
  distDir: ciDistDir && ciDistDir.length > 0 ? ciDistDir : undefined,
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
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },
  serverExternalPackages: ["iyzipay"],

  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/:colorSlug-:fabricSlug-:categorySlug",
          destination: "/kesfet/:categorySlug/:colorSlug/:fabricSlug",
        },
      ],
    };
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' https://sandbox-api.iyzipay.com https://checkout.iyzipay.com;",
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  widenClientFileUpload: true,
  telemetry: false,
});
