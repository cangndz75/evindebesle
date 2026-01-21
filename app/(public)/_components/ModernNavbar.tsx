"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Menu, Search, User, Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function ModernNavbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Sol: Menü */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/men"
              className="text-sm font-light text-black hover:opacity-70 transition-opacity uppercase hidden md:inline"
            >
              Erkek
            </Link>
            <Link
              href="/women"
              className="text-sm font-light text-black hover:opacity-70 transition-opacity uppercase hidden md:inline"
            >
              Kadın
            </Link>
            <Link
              href="/kids"
              className="text-sm font-light text-black hover:opacity-70 transition-opacity uppercase hidden lg:inline"
            >
              Çocuk
            </Link>
            <Link
              href="/bundles"
              className="text-sm font-light text-black hover:opacity-70 transition-opacity uppercase hidden lg:inline"
            >
              Paketler
            </Link>
            <Link
              href="/sale"
              className="text-sm font-light text-black hover:opacity-70 transition-opacity uppercase hidden lg:inline"
            >
              Son Fırsat
            </Link>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 text-black hover:opacity-70 transition-opacity md:hidden">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-6">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menü</SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                  <Link
                    href="/about"
                    onClick={() => setMenuOpen(false)}
                    className="block text-black font-light hover:opacity-70 transition-opacity"
                  >
                    Hakkımızda
                  </Link>
                  <Link
                    href="/services"
                    onClick={() => setMenuOpen(false)}
                    className="block text-black font-light hover:opacity-70 transition-opacity"
                  >
                    Hizmetler
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMenuOpen(false)}
                    className="block text-black font-light hover:opacity-70 transition-opacity"
                  >
                    İletişim
                  </Link>
                  <Link
                    href="/blog"
                    onClick={() => setMenuOpen(false)}
                    className="block text-black font-light hover:opacity-70 transition-opacity"
                  >
                    Blog
                  </Link>
                  {session?.user ? (
                    <Link
                      href="/profile/personal-info"
                      onClick={() => setMenuOpen(false)}
                      className="block text-black font-light hover:opacity-70 transition-opacity mt-8"
                    >
                      Profilim
                    </Link>
                  ) : (
                    <Link
                      href="/auth-tabs"
                      onClick={() => setMenuOpen(false)}
                      className="block text-black font-light hover:opacity-70 transition-opacity mt-8"
                    >
                      Giriş Yap
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Orta: Logo */}
          <Link
            href="/home"
            className="flex-1 flex justify-center"
          >
            <span className="text-2xl md:text-3xl font-serif font-light text-black tracking-wider uppercase">
              Dark Velvet
            </span>
          </Link>

          {/* Sağ: İkonlar */}
          <div className="flex items-center gap-4 md:gap-6">
            <button
              className="text-black hover:opacity-70 transition-opacity"
              aria-label="Ara"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href={session?.user ? "/profile/personal-info" : "/auth-tabs"}
              className="text-black hover:opacity-70 transition-opacity"
              aria-label="Hesabım"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              href={session?.user ? "/favorites" : "/auth-tabs"}
              className="relative text-black hover:opacity-70 transition-opacity"
              aria-label="Favoriler"
            >
              <Heart className="w-5 h-5" />
              {session?.user && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-light">
                  3
                </span>
              )}
            </Link>
            <button
              className="relative text-black hover:opacity-70 transition-opacity"
              aria-label="Sepet"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-light">
                2
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
