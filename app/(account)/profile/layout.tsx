"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/app/(public)/_components/Navbar";
import Sidebar from "@/app/(account)/profile/_components/Sidebar";
import ProfileMobileHeader from "@/app/(account)/profile/_components/ProfileMobileHeader";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Sayfa değiştiğinde scroll'u en üste al - useLayoutEffect render'dan önce çalışır
  useLayoutEffect(() => {
    // Tüm scroll pozisyonlarını sıfırla
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  // Ek güvence için useEffect de ekle (render sonrası)
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-screen bg-white overflow-x-hidden">
        <aside className="hidden md:block w-64 border-r bg-gray-50 px-4 py-6 shrink-0">
          <Sidebar />
        </aside>

        <main className="flex-1 w-full max-w-full px-4 md:px-10 py-6">
          <ProfileMobileHeader />
          <div className="mt-4">{children}</div>
        </main>
      </div>
    </>
  );
}
