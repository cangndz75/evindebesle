import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import SessionWrapper from "./(public)/_components/SessionWrapper";
import ToasterWrapper from "./(public)/_components/ToasterWrapper";
import Navbar from "./(public)/_components/Navbar";
import Footer from "./(public)/_components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evinde Besle",
  description: "Evcil hayvan sahipleri için evde bakım hizmetleri",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <SessionWrapper>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToasterWrapper />
        </SessionWrapper>
      </body>
    </html>
  );
}
