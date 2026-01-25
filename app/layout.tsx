import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import SessionWrapper from "./(public)/_components/SessionWrapper";
import ToasterWrapper from "./(public)/_components/ToasterWrapper";
import SiteHeader from "@/components/home/SiteHeader";
import OrganizationSchema from "@/components/seo/OrganizationSchema";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dark Velvet - Premium İç Çamaşırı",
  description: "Dark Velvet - Erkek ve kadın premium iç çamaşırı koleksiyonu. Zarif tasarımlar, konforlu kumaşlar ve modern stil.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Evinde Besle",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-[#F7F5F2] overflow-x-hidden`}>
        <OrganizationSchema />
        <SessionWrapper>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <ToasterWrapper />
        </SessionWrapper>
      </body>
    </html>
  );
}

