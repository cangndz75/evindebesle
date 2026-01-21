"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Heart, User, ShoppingBag, Menu, X, ChevronRight, LogOut, LogIn } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { signOut } from "next-auth/react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SearchModal from "./SearchModal";
import AnnouncementBanner from "./AnnouncementBanner";

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

export default function DarkVelvetHeroHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<MenuKey | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const { user } = useCurrentUser();

  useEffect(() => {
    setMounted(true);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 18));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const nav = useMemo(
    () =>
      [
        { key: "men" as const, label: "ERKEK", href: "/men" },
        { key: "women" as const, label: "KADIN", href: "/women" },
        { key: "kids" as const, label: "ÇOCUK", href: "/kids" },
        { key: "bundles" as const, label: "PAKETLER", href: "/bundles" },
        { key: "lastcall" as const, label: "SON FIRSAT", href: "/last-call" },
      ] as const,
    []
  );

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

  const isSolid = true; // Always white background

  return (
    <section className="relative w-full h-[70vh] md:h-[92vh] overflow-hidden bg-white">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1537274942065-eda9d00a6293?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Hero"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          unoptimized
        />
        {/* Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/40" />
      </div>

      <AnnouncementBanner />

      <header
        className={[
          "fixed left-0 right-0 z-[70] transition-all duration-300",
          "top-9",
          mounted && scrolled
            ? "bg-white border-b border-black/10"
            : "bg-transparent md:bg-white md:border-b md:border-black/10",
        ].join(" ")}
        onMouseLeave={scheduleClose}
      >
        <div className="w-full px-4 md:px-6">
          <div className="h-16 flex items-center justify-between relative">
            {/* Desktop: Left Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {nav.map((item) => (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => open(item.key)}
                  onMouseLeave={scheduleClose}
                >
                  <Link
                    href={item.href}
                    className="text-sm font-light uppercase tracking-wide text-black hover:opacity-70 transition-opacity"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>

            {/* Mobile: Hamburger Menu + Logo */}
            <div className="md:hidden flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={(open) => {
                setMobileMenuOpen(open);
                if (!open) setMobileSubMenu(null);
              }}>
                <SheetTrigger asChild>
                  <button
                    className="hover:opacity-70 transition-opacity text-black p-1"
                    aria-label="Menü"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 overflow-y-auto">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-black/10">
                    <div className="flex items-center gap-3">
                      {mobileSubMenu && (
                        <button
                          onClick={() => setMobileSubMenu(null)}
                          className="hover:opacity-70 transition-opacity"
                          aria-label="Geri"
                        >
                          <ChevronRight className="h-5 w-5 rotate-180" />
                        </button>
                      )}
                      <SheetTitle className="text-lg font-light uppercase tracking-wide text-[#111]">
                        {mobileSubMenu ? mega[mobileSubMenu].left[0]?.title || nav.find(n => n.key === mobileSubMenu)?.label : "Menü"}
                      </SheetTitle>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="hover:opacity-70 transition-opacity"
                      aria-label="Kapat"
                    >
                      <X className="h-5 w-5 text-[#111]" />
                    </button>
                  </div>

                  {/* Menu Content */}
                  <div className="px-4 py-6">
                    {!mobileSubMenu ? (
                      /* Main Menu */
                      <div className="space-y-0">
                        {nav.map((item) => {
                          const hasSubMenu = mega[item.key]?.left && mega[item.key].left.length > 0;
                          return (
                            <div key={item.key}>
                              {hasSubMenu ? (
                                <button
                                  onClick={() => setMobileSubMenu(item.key)}
                                  className="w-full flex items-center justify-between py-4 text-left text-[#111] text-base font-light uppercase tracking-wide hover:opacity-70 transition-opacity border-b border-black/10"
                                >
                                  <span>{item.label}</span>
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              ) : (
                                <Link
                                  href={item.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block py-4 text-[#111] text-base font-light uppercase tracking-wide hover:opacity-70 transition-opacity border-b border-black/10"
                                >
                                  {item.label}
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Sub Menu */
                      <div className="space-y-0">
                        {mega[mobileSubMenu]?.left.map((group, groupIdx) => (
                          <div key={groupIdx} className={groupIdx > 0 ? "mt-8" : ""}>
                            {group.title && (
                              <h3 className="text-xs uppercase tracking-wider text-[#111]/60 mb-4 font-light">
                                {group.title}
                              </h3>
                            )}
                            <div className="space-y-0">
                              {group.items.map((link, linkIdx) => (
                                <Link
                                  key={`${link.href}-${linkIdx}`}
                                  href={link.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block py-3 text-[#111] text-sm font-light hover:opacity-70 transition-opacity border-b border-black/5"
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Login/Logout Section */}
                    <div className="mt-8 pt-6 border-t border-black/10">
                      {user ? (
                        <div className="space-y-3">
                          <Link
                            href="/profile"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 py-3 text-[#111] text-sm font-light hover:opacity-70 transition-opacity"
                          >
                            <User className="h-5 w-5" />
                            <span>Hesabım</span>
                          </Link>
                          <button
                            onClick={async () => {
                              await signOut({ redirect: false });
                              setMobileMenuOpen(false);
                              window.location.href = "/";
                            }}
                            className="flex items-center gap-3 py-3 text-[#111] text-sm font-light hover:opacity-70 transition-opacity w-full text-left"
                          >
                            <LogOut className="h-5 w-5" />
                            <span>Çıkış Yap</span>
                          </button>
                        </div>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 py-3 text-[#111] text-sm font-light hover:opacity-70 transition-opacity"
                        >
                          <LogIn className="h-5 w-5" />
                          <span>Giriş Yap</span>
                        </Link>
                      )}
                    </div>

                    {/* Mobil İkonlar - Altta */}
                    <div className="mt-8 pt-6 border-t border-black/10 space-y-3">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setSearchModalOpen(true);
                        }}
                        className="flex items-center gap-3 text-[#111] font-light hover:opacity-70 transition-opacity w-full text-left"
                      >
                        <Search className="h-5 w-5" />
                        <span>Ara</span>
                      </button>
                      <Link
                        href={user ? "/favorites" : "/login"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-[#111] font-light hover:opacity-70 transition-opacity"
                      >
                        <Heart className="h-5 w-5" />
                        <span>Favoriler</span>
                      </Link>
                      <Link
                        href="/cart"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-[#111] font-light hover:opacity-70 transition-opacity"
                      >
                        <ShoppingBag className="h-5 w-5" />
                        <span>Sepet</span>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Mobile Logo - Next to hamburger, animated on scroll */}
              <motion.div
                initial={{ opacity: 0, x: -15, scale: 0.95 }}
                animate={{ 
                  opacity: mounted && scrolled ? 1 : 0,
                  x: mounted && scrolled ? 0 : -15,
                  scale: mounted && scrolled ? 1 : 0.95
                }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.16, 1, 0.3, 1],
                  opacity: { duration: 0.3 }
                }}
                className="flex-shrink-0"
              >
                <Link
                  href="/"
                  className="text-lg tracking-[0.25em] uppercase text-black whitespace-nowrap"
                >
                  Dark Velvet
                </Link>
              </motion.div>
            </div>

            {/* Desktop Logo - Centered */}
            <Link
              href="/"
              className="hidden md:block absolute left-1/2 -translate-x-1/2 text-xl tracking-[0.25em] uppercase transition-colors text-black"
            >
              Dark Velvet
            </Link>

            {/* Right Icons */}
            <div className="flex items-center gap-4 md:gap-5 transition-colors text-black ml-auto">
              {/* Mobile: Search Icon */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="md:hidden hover:opacity-70 transition-opacity p-1"
                aria-label="Ara"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {/* Mobile: User Icon */}
              <Link href={user ? "/profile/personal-info" : "/auth-tabs"} className="md:hidden hover:opacity-70 transition-opacity p-1">
                <User className="h-5 w-5" />
              </Link>
              
              {/* Desktop: Search, User & Heart */}
              <div className="hidden md:flex items-center gap-5">
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label="Ara"
                >
                  <Search className="h-5 w-5" />
                </button>
                <Link
                  href={user ? "/profile/personal-info" : "/auth-tabs"}
                  className="hover:opacity-70 transition-opacity"
                  aria-label="Hesabım"
                >
                  <User className="h-5 w-5" />
                </Link>
                <Link
                  href={user ? "/favorites" : "/auth-tabs"}
                  className="hover:opacity-70 transition-opacity relative"
                  aria-label="Favoriler"
                >
                  <Heart className="h-5 w-5" />
                </Link>
              </div>
              
              {/* Cart - Always visible */}
              <Link
                href="/cart"
                className="relative p-1 hover:opacity-70 transition-opacity"
                aria-label="Sepet"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-[10px] leading-4 text-center bg-black text-white">
                  0
                </span>
              </Link>
            </div>
          </div>

        </div>

        {/* Desktop Mega Menu */}
        {openMenu && (
          <div
            className="hidden md:block absolute left-0 right-0 top-full bg-white border-t border-black/10 shadow-lg"
            onMouseEnter={keepOpen}
            onMouseLeave={scheduleClose}
          >
            <div className="w-full px-4 md:px-6 py-12">
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

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      <div className="relative z-10 h-full flex items-center justify-center text-center">
        <div className="w-full max-w-5xl mx-auto pt-12 md:pt-16 px-4 md:px-10">
          <p className="text-white/90 text-xs md:text-sm tracking-[0.22em] uppercase mb-4 md:mb-6">
            Gardırobunu yenile, konforu yeniden tanımla
          </p>

          <h1 className="text-white font-serif font-light leading-[0.9] text-[3rem] md:text-[4.2rem] lg:text-[6rem] xl:text-[7.5rem] mb-6 md:mb-10">
            <span className="block">Modern Bir</span>
            <span className="block">Yenilenme</span>
          </h1>

          <div className="flex flex-row items-center justify-center gap-3 md:gap-4">
            <Link
              href="/women"
              className="w-full max-w-[200px] md:w-auto px-8 md:px-12 py-3 md:py-4 border-2 border-white text-white text-xs md:text-sm tracking-[0.22em] uppercase hover:bg-white hover:text-black transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              KADIN
            </Link>
            <Link
              href="/men"
              className="w-full max-w-[200px] md:w-auto px-8 md:px-12 py-3 md:py-4 border-2 border-white text-white text-xs md:text-sm tracking-[0.22em] uppercase hover:bg-white hover:text-black transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              ERKEK
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
