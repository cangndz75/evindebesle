import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import SessionWrapper from "./(public)/_components/SessionWrapper";
import ToasterWrapper from "./(public)/_components/ToasterWrapper";
import SiteHeader from "@/components/home/SiteHeader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dark Velvet - Premium İç Çamaşırı",
  description: "Dark Velvet - Erkek ve kadın premium iç çamaşırı koleksiyonu. Zarif tasarımlar, konforlu kumaşlar ve modern stil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="overflow-x-hidden">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-[#F7F5F2] overflow-x-hidden`}>
        <SessionWrapper>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <ToasterWrapper />
        </SessionWrapper>
      </body>
    </html>
  );
}
