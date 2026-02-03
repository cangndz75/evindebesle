import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import SessionWrapper from "./(public)/_components/SessionWrapper";
import ToasterWrapper from "./(public)/_components/ToasterWrapper";
import SiteHeader from "@/components/home/SiteHeader";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import WebSiteSchema from "@/components/seo/WebSiteSchema";
import ConditionalFooter from "@/components/structure/ConditionalFooter";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dark Velvet - Premium İç ve Dış Giyim Koleksiyonu",
  description: "Türkiye'nin önde gelen premium iç giyim markası. Kadın ve erkek için kaliteli iç çamaşırı, külot, sütyen, boxer, sweat ve daha fazlası. Ücretsiz kargo ve hızlı teslimat.",
  applicationName: "Dark Velvet",
  keywords: [
    "iç çamaşırı",
    "kadın iç çamaşırı",
    "erkek iç çamaşırı",
    "külot",
    "sütyen",
    "boxer",
    "sweat",
    "iç giyim",
    "dış giyim",
    "premium iç çamaşırı",
    "Dark Velvet",
    "online iç çamaşırı",
    "kaliteli iç giyim"
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Dark Velvet",
    title: "Dark Velvet - Premium İç ve Dış Giyim",
    description: "Türkiye'nin önde gelen premium iç giyim markası. Kadın ve erkek için kaliteli iç çamaşırı.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dark Velvet Premium İç Giyim"
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
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
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
    <html lang="tr" className="overflow-x-hidden">
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
        <OrganizationSchema />
        <WebSiteSchema />
        <SessionWrapper>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
          <ToasterWrapper />
        </SessionWrapper>
      </body>
    </html>
  );
}

