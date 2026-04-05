"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TopBar() {
  return (
    <div className="w-full bg-black text-white text-xs md:text-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-10 md:h-12">
          
          <div className="hidden md:block">
            <span className="font-light">ÜCRETSİZ KARGO 150₺ ÜZERİ SİPARİŞLERDE</span>
          </div>

          
          <div className="flex items-center gap-2 flex-1 justify-center">
            <button className="hover:opacity-70 transition-opacity">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="font-light text-center text-xs md:text-sm">
              YILINIZI YENİDEN TANIMLAYIN | MODERN RESET
            </span>
            <button className="hover:opacity-70 transition-opacity">
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          
          <div className="hidden md:block">
            <Link href="/rewards" className="font-light hover:opacity-70 transition-opacity">
              DARK VELVET+ ÖDÜLLER | Hemen Katıl
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
