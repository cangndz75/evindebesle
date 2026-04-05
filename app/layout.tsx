import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import SessionWrapper from "./(public)/_components/SessionWrapper";
import ToasterWrapper from "./(public)/_components/ToasterWrapper";
import SiteHeader from "@/components/home/SiteHeader";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import WebSiteSchema from "@/components/seo/WebSiteSchema";
import AnalyticsScripts from "@/components/seo/AnalyticsScripts";
import ConditionalFooter from "@/components/structure/ConditionalFooter";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dark Velvet - Premium Ä°Ã§ ve DÄ±ÅŸ Giyim Koleksiyonu",
  description: "TÃ¼rkiye'nin Ã¶nde gelen premium iÃ§ giyim markasÄ±. KadÄ±n ve erkek iÃ§in kaliteli iÃ§ Ã§amaÅŸÄ±rÄ±, kÃ¼lot, sÃ¼tyen, boxer, sweat ve daha fazlasÄ±. Ãœcretsiz kargo ve hÄ±zlÄ± teslimat.",
  applicationName: "Dark Velvet",
  keywords: [
    "iÃ§ Ã§amaÅŸÄ±rÄ±",
    "kadÄ±n iÃ§ Ã§amaÅŸÄ±rÄ±",
    "erkek iÃ§ Ã§amaÅŸÄ±rÄ±",
    "kÃ¼lot",
    "sÃ¼tyen",
    "boxer",
    "sweat",
    "iÃ§ giyim",
    "dÄ±ÅŸ giyim",
    "premium iÃ§ Ã§amaÅŸÄ±rÄ±",
    "Dark Velvet",
    "online iÃ§ Ã§amaÅŸÄ±rÄ±",
    "kaliteli iÃ§ giyim"
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Dark Velvet",
    title: "Dark Velvet - Premium Ä°Ã§ ve DÄ±ÅŸ Giyim",
    description: "TÃ¼rkiye'nin Ã¶nde gelen premium iÃ§ giyim markasÄ±. KadÄ±n ve erkek iÃ§in kaliteli iÃ§ Ã§amaÅŸÄ±rÄ±.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dark Velvet Premium Ä°Ã§ Giyim"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@darkvelvet",
    creator: "@darkvelvet"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com"
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dark Velvet"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        {/* Preconnect for faster external resource loading */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* PWA and Mobile Optimization */}
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-[#F7F5F2] overflow-x-hidden`}>
        <a
          href="#main-content"
          className="dv-skip-link"
        >
          Iceriye atla
        </a>
        <OrganizationSchema />
        <WebSiteSchema />
        <AnalyticsScripts />
        <SessionWrapper>
          <SiteHeader />
          <main id="main-content" className="flex-1">{children}</main>
          <ConditionalFooter />
          <ToasterWrapper />
        </SessionWrapper>
      </body>
    </html>
  );
}

