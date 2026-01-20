"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, Search, User, Heart, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MenuKey = "men" | "women" | "kids" | "bundles" | "lastcall";

type MegaGroup = {
  title?: string;
  items: { label: string; href: string }[];
};

type Promo = {
  title: string;
  subtitle: string;
  image: string;
  href: string;
};

// Navigation items - 2. resimdeki gibi
const navItems = [
  { key: "men" as const, label: "ERKEK", href: "/men" },
  { key: "women" as const, label: "KADIN", href: "/women" },
  { key: "kids" as const, label: "ÇOCUK", href: "/kids" },
  { key: "bundles" as const, label: "PAKETLER", href: "/bundles" },
  { key: "lastcall" as const, label: "SON FIRSAT", href: "/last-call" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const closeTimer = useRef<number | null>(null);

  const mega = useMemo<Record<MenuKey, { left: MegaGroup[]; rightPromo: Promo }>>(
    () => ({
      men: {
        left: [
          {
            title: "MODERN BİR YENİLENME",
            items: [
              { label: "Aktif Koleksiyon", href: "/men/active" },
              { label: "En Çok Satanlar", href: "/men/best-sellers" },
              { label: "Yeni Çıkanlar", href: "/men/new" },
              { label: "Ayakkabı", href: "/men/footwear" },
              { label: "Son Fırsat", href: "/men/last-call" },
              { label: "Tümünü Gör", href: "/men" },
            ],
          },
          {
            title: "ÜST GİYİM",
            items: [
              { label: "Kısa Kollu", href: "/men/tops/short-sleeves" },
              { label: "Polo & Gömlek", href: "/men/tops/polos" },
              { label: "Uzun Kollu", href: "/men/tops/long-sleeves" },
              { label: "Kazak & Sweatshirt", href: "/men/tops/pullovers" },
              { label: "Ceket & Dış Giyim", href: "/men/tops/outerwear" },
              { label: "Aktif Üst Giyim", href: "/men/tops/active" },
              { label: "Atlet", href: "/men/tops/tanks" },
              { label: "Tüm Üst Giyim", href: "/men/tops" },
            ],
          },
          {
            title: "ALT GİYİM",
            items: [
              { label: "Pantolon", href: "/men/bottoms/pants" },
              { label: "Jogger", href: "/men/bottoms/joggers" },
              { label: "Şort", href: "/men/bottoms/shorts" },
              { label: "Aktif Alt Giyim", href: "/men/bottoms/active" },
              { label: "Yüzme Şortu", href: "/men/bottoms/swim" },
              { label: "İç Çamaşırı", href: "/men/bottoms/underwear" },
              { label: "Tüm Alt Giyim", href: "/men/bottoms" },
            ],
          },
          {
            title: "AYAKKABI & AKSESUAR",
            items: [
              { label: "Ayakkabı", href: "/men/accessories/footwear" },
              { label: "Şapka", href: "/men/accessories/headwear" },
              { label: "Çorap", href: "/men/accessories/socks" },
              { label: "Güneş Gözlüğü", href: "/men/accessories/sunglasses" },
              { label: "Çanta", href: "/men/accessories/bags" },
              { label: "Hediye Kartı", href: "/gift-cards" },
              { label: "Tümünü Gör", href: "/men/accessories" },
            ],
          },
        ],
        rightPromo: {
          title: "Modern Bir Yenilenme",
          subtitle: "Gardırobunu yenile",
          image:
            "https://images.unsplash.com/photo-1520975958225-2b6b5a2d2676?q=80&w=1200&auto=format&fit=crop",
          href: "/collections/modern-reset",
        },
      },
      women: {
        left: [
          {
            title: "MODERN TEMEL PARÇALAR",
            items: [
              { label: "Yeni Gelenler", href: "/women/new" },
              { label: "En Çok Satanlar", href: "/women/best-sellers" },
              { label: "Takım Koleksiyon", href: "/women/sets" },
              { label: "Sütyen", href: "/women/bras" },
              { label: "İç Çamaşırı", href: "/women/underwear" },
              { label: "Şekillendirici", href: "/women/shapewear" },
              { label: "Tümünü Gör", href: "/women" },
            ],
          },
          {
            title: "KOLEKSİYONLAR",
            items: [
              { label: "Seamless", href: "/women/collections/seamless" },
              { label: "Dantel Stüdyo", href: "/women/collections/lace" },
              { label: "İkinci Cilt", href: "/women/collections/second-skin" },
              { label: "Aktif", href: "/women/collections/active" },
              { label: "Lounge Giyim", href: "/women/collections/loungewear" },
              { label: "Son Fırsat", href: "/women/last-call" },
            ],
          },
          {
            title: "ÜST GİYİM",
            items: [
              { label: "Body", href: "/women/bodies" },
              { label: "Üst Giyim", href: "/women/tops/all" },
              { label: "Sabahlık", href: "/women/robes" },
              { label: "Tüm Üst Giyim", href: "/women/tops" },
            ],
          },
          {
            title: "ALT GİYİM",
            items: [
              { label: "Külot", href: "/women/underwear/briefs" },
              { label: "Tanga", href: "/women/underwear/thongs" },
              { label: "Bikini", href: "/women/underwear/bikinis" },
              { label: "Uyku", href: "/women/sleep" },
              { label: "Tüm Alt Giyim", href: "/women/underwear" },
            ],
          },
        ],
        rightPromo: {
          title: "Modern Takım",
          subtitle: "Temiz lüks, yükseltilmiş",
          image:
            "https://images.unsplash.com/photo-1520975661595-6453be3f7070?q=80&w=1200&auto=format&fit=crop",
          href: "/collections/modern-set",
        },
      },
      kids: {
        left: [
          {
            title: "ÇOCUK",
            items: [
              { label: "Yeni Gelenler", href: "/kids/new" },
              { label: "En Çok Satanlar", href: "/kids/best-sellers" },
              { label: "Takımlar", href: "/kids/sets" },
              { label: "Tümünü Gör", href: "/kids" },
            ],
          },
        ],
        rightPromo: {
          title: "Çocuk Temel Parçalar",
          subtitle: "Yumuşak, dayanıklı, kolay",
          image:
            "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
          href: "/kids",
        },
      },
      bundles: {
        left: [
          {
            title: "PAKETLER",
            items: [
              { label: "Değer Paketleri", href: "/bundles/value" },
              { label: "Hediye Paketleri", href: "/bundles/gift" },
              { label: "Tümünü Gör", href: "/bundles" },
            ],
          },
        ],
        rightPromo: {
          title: "Paketler",
          subtitle: "Birlikte daha iyi",
          image:
            "https://images.unsplash.com/photo-1520975682031-a8d9c7b0a0b8?q=80&w=1200&auto=format&fit=crop",
          href: "/bundles",
        },
      },
      lastcall: {
        left: [
          {
            title: "SON FIRSAT",
            items: [
              { label: "Erkek", href: "/last-call/men" },
              { label: "Kadın", href: "/last-call/women" },
              { label: "Çocuk", href: "/last-call/kids" },
              { label: "Tümünü Gör", href: "/last-call" },
            ],
          },
        ],
        rightPromo: {
          title: "Son Fırsat",
          subtitle: "Sınırlı stok",
          image:
            "https://images.unsplash.com/photo-1520975958225-2b6b5a2d2676?q=80&w=1200&auto=format&fit=crop",
          href: "/last-call",
        },
      },
    }),
    []
  );

  const open = (key: MenuKey) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };

  const keepOpen = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 120);
  };

  // Homepage'de SiteHeader'ı gizle (ByltStyleHero kendi header'ını içeriyor)
  if (pathname === "/home" || pathname === "/") {
    return null;
  }

  return (
    <>
      {/* Üstte ince siyah çizgi */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[1px] bg-black" />
      
      <header 
        className="fixed top-[1px] left-0 right-0 z-50 bg-white border-b border-black/10"
        onMouseLeave={scheduleClose}
      >
        <nav className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="relative flex items-center justify-between h-16 md:h-20">
            {/* Sol: Menü */}
            <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-3 md:gap-4 lg:gap-6">
                {navItems.map((item) => (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() => open(item.key)}
                    onMouseLeave={scheduleClose}
                  >
                    <Link
                      href={item.href}
                      className="text-xs md:text-sm font-light hover:opacity-70 transition-all uppercase text-[#111]"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>

            {/* Mobile Menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden hover:opacity-70 transition-opacity text-[#111]"
                  aria-label="Menü"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-6">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menü</SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block text-[#111] font-light hover:opacity-70 transition-opacity uppercase"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Orta: Logo - Absolute positioned for perfect centering */}
          <Link
            href="/home"
            className="absolute left-1/2 -translate-x-1/2"
            aria-label="Ana Sayfa"
          >
            <span className="text-2xl md:text-3xl font-serif font-light tracking-wider text-[#111]">
              DARK VELVET
            </span>
          </Link>

          {/* Sağ: İkonlar */}
          <div className="flex items-center gap-4 md:gap-6">
            <button
              className="hover:opacity-70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded text-[#111] focus-visible:ring-[#111]"
              aria-label="Ara"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href={session?.user ? "/profile/personal-info" : "/auth-tabs"}
              className="hover:opacity-70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded text-[#111] focus-visible:ring-[#111]"
              aria-label="Hesabım"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              href="/favorites"
              className="relative hover:opacity-70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded text-[#111] focus-visible:ring-[#111]"
              aria-label="Favoriler"
            >
              <Heart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-light bg-[#111]">
                0
              </span>
            </Link>
            <Link
              href="/cart"
              className="relative hover:opacity-70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded text-[#111] focus-visible:ring-[#111]"
              aria-label="Sepet"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-light bg-[#111]">
                0
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Desktop Mega Menu */}
      {openMenu && (
        <div
          className="hidden md:block fixed left-0 right-0 top-[81px] z-50 bg-white border-t border-black/10 shadow-lg"
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
            <div className="grid grid-cols-12 gap-12">
              <div className="col-span-9">
                <div className="grid grid-cols-4 gap-12">
                  {mega[openMenu].left.map((group, idx) => (
                    <div key={`${openMenu}-${idx}`}>
                      {group.title && (
                        <div className="text-[11px] tracking-[0.22em] uppercase mb-5 text-black/70">
                          {group.title}
                        </div>
                      )}
                      <ul className="space-y-3">
                        {group.items.map((it, itemIdx) => (
                          <li key={`${it.href}-${itemIdx}`}>
                            <Link
                              href={it.href}
                              className="block text-[#111] text-sm font-light hover:opacity-70 transition-opacity"
                            >
                              {it.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-3">
                <Link href={mega[openMenu].rightPromo.href} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                    <Image
                      src={mega[openMenu].rightPromo.image}
                      alt={mega[openMenu].rightPromo.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="300px"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-sm font-light text-[#111] mb-1">
                    {mega[openMenu].rightPromo.title}
                  </h3>
                  <p className="text-xs text-[#111]/60 font-light">
                    {mega[openMenu].rightPromo.subtitle}
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      </header>
    </>
  );
}
