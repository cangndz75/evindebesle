"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, Search, User, Heart, ShoppingBag, X, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import ShoppingCart from "@/app/(public)/_components/ShoppingCart";
import SearchModal from "@/components/home/SearchModal";
import CartPreview from "@/components/home/CartPreview";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import { useHeaderStore } from "@/lib/stores/headerStore";
import { useCategories } from "@/hooks/useCategories";
import { useCollections } from "@/hooks/useCollections";
import { useCartStore } from "@/lib/stores/cartStore";

type MenuKey = "men" | "women" | "new" | "collections" | "blog" | "about";

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

const navItems = [
  { key: "men" as const, label: "ERKEK", href: "/men" },
  { key: "women" as const, label: "KADIN", href: "/women" },
  { key: "new" as const, label: "YENİ", href: "/new-arrivals" },
  { key: "collections" as const, label: "KOLEKSİYON", href: "/collections" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileMenuState, setMobileMenuState] = useState<"main" | "men" | "women">("main");
  const { categories: menCategories, loading: menCategoriesLoading } = useCategories({
    productGender: "MALE",
    includeUnisex: true,
    withProducts: true,
  });
  const { categories: womenCategories, loading: womenCategoriesLoading } = useCategories({
    productGender: "FEMALE",
    includeUnisex: true,
    withProducts: true,
  });
  const { collections, loading: collectionsLoading } = useCollections();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const cartIconRef = useRef<HTMLButtonElement | null>(null);

  const {
    cartCount,
    favoriteCount,
    freeShippingThreshold,
    hydrate: hydrateHeader,
    refreshCartCount,
    refreshFavoriteCount,
  } = useHeaderStore();

  const cartHydrated = useCartStore((state) => state.hydrated);
  const hydrateCart = useCartStore((state) => state.hydrate);
  const syncGuestCartToAPI = useCartStore((state) => state.syncGuestCartToAPI);
  const categoriesLoading = menCategoriesLoading || womenCategoriesLoading;
  const activeMobileCategories = mobileMenuState === "men" ? menCategories : womenCategories;

  useEffect(() => {
    hydrateHeader(session);

    if (!cartHydrated) {
      hydrateCart();
    }
  }, [session, hydrateHeader, cartHydrated, hydrateCart]);

  useEffect(() => {
    if (session?.user && cartHydrated) {
      const syncCart = async () => {
        try {
          await syncGuestCartToAPI();
          await refreshCartCount(session);
        } catch (error) {
          console.error("Cart sync error in header:", error);
        }
      };

      syncCart();
    }
  }, [session, cartHydrated, syncGuestCartToAPI, refreshCartCount]);

  useEffect(() => {
    const handleOpenCart = () => {
      setCartOpen(true);
    };
    window.addEventListener('openCart', handleOpenCart);
    return () => window.removeEventListener('openCart', handleOpenCart);
  }, []);

  useEffect(() => {
    const handleFavoriteUpdate = () => {
      refreshFavoriteCount(session);
    };
    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);
    return () => window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
  }, [session, refreshFavoriteCount]);

  useEffect(() => {
    const handleCartUpdate = () => {
      refreshCartCount(session);
    };

    const handleOpenCart = () => {
      setCartOpen(true);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("openCart", handleOpenCart);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("openCart", handleOpenCart);
    };
  }, [session, refreshCartCount]);

  const mega = useMemo<Record<MenuKey, { left: MegaGroup[]; rightPromo: Promo | null }>>(
    () => {
      const result: Record<MenuKey, { left: MegaGroup[]; rightPromo: Promo | null }> = {
        men: {
          left: [
            {
              title: "YENİ GELENLER",
              items: [
                { label: "Bu Haftalık", href: "/new-arrivals" },
                { label: "En Yeniler", href: "/new-arrivals" },
                { label: "Trending", href: "/new-arrivals" },
              ],
            },
            {
              title: "KATEGORİLER",
              items: categoriesLoading
                ? Array.from({ length: 6 }).map((_, idx) => ({ label: `loading-men-${idx}`, href: "#loading" }))
                : menCategories.map(c => ({ label: c.name, href: `/men?category=${c.slug}` })),
            },
          ],
          rightPromo: {
            title: "Erkek Koleksiyonu",
            subtitle: "Modern ve zamansız parçalar",
            image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1200&auto=format&fit=crop",
            href: "/men",
          },
        },
        women: {
          left: [
            {
              title: "YENİ GELENLER",
              items: [
                { label: "Bu Haftalık", href: "/new-arrivals" },
                { label: "En Yeniler", href: "/new-arrivals" },
                { label: "Trending", href: "/new-arrivals" },
              ],
            },
            {
              title: "KATEGORİLER",
              items: categoriesLoading
                ? Array.from({ length: 6 }).map((_, idx) => ({ label: `loading-women-${idx}`, href: "#loading" }))
                : womenCategories.map(c => ({ label: c.name, href: `/women?category=${c.slug}` })),
            },
          ],
          rightPromo: {
            title: "Kadın Koleksiyonu",
            subtitle: "Zarafet ve stil",
            image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
            href: "/women",
          },
        },
        new: { 
          left: [],
          rightPromo: null
        },
        collections: {
          left: [
            {
              title: "KOLEKSİYONLAR",
              items: collections.length > 0
                ? collections.map(c => ({ label: c.title, href: `/collections/${c.slug}` }))
                : [
                  { label: "Minimalist", href: "/collections/minimalist" },
                  { label: "Dark Edition", href: "/collections/dark" },
                  { label: "Velvet Soft", href: "/collections/velvet" },
                ],
            },
          ],
          rightPromo: {
            title: "Dark Collection",
            subtitle: "Özel seri tasarımlar",
            image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop",
            href: "/collections",
          },
        },
        about: {
          left: [
            {
              title: "KURUMSAL",
              items: [
                { label: "Hakkımızda", href: "/about" },
                { label: "İletişim", href: "/contact" },
                { label: "Sıkça Sorulan Sorular", href: "/faq" },
              ],
            },
          ],
          rightPromo: {
            title: "Modern Giyim",
            subtitle: "Biz kimiz?",
            image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200&auto=format&fit=crop",
            href: "/about",
          },
        },
        blog: {
          left: [],
          rightPromo: {
            title: "Fashion Blog",
            subtitle: "Stil önerileri ve moda haberleri",
            image: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?q=80&w=1200&auto=format&fit=crop",
            href: "/blog",
          },
        },
      };

      ["men", "women"].forEach((key) => {
        const principalGroup = result[key as MenuKey].left.find(g => g.title === "KATEGORİLER");
        if (principalGroup) {
          principalGroup.items.push({ label: "Tümünü Gör", href: `/${key}` });
        }
      });

      return result;
    },
    [categoriesLoading, collections, menCategories, womenCategories]
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
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 200);
  };

  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/users") ||
    pathname?.startsWith("/coupons") ||
    pathname?.startsWith("/company-settings") ||
    pathname?.startsWith("/campaigns")
  ) {
    return null;
  }

  if (pathname === "/checkout") {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-black/10 w-full">
        <div className="w-full px-4 md:px-8 h-16 md:h-20 flex items-center justify-between relative">
          
          <div className="w-10"></div>

          
          <div className="absolute left-1/2 -translate-x-1/2 text-2xl md:text-3xl font-serif font-light tracking-wider text-[#111]">
            Dark velvet
          </div>

          
          <Link href="/cart" className="hover:opacity-70 transition-opacity">
            <ShoppingBag className="w-6 h-6 text-[#111]" />
          </Link>
        </div>
      </header>
    );
  }

  const bannerVariant = "default";


  return (
    <div className="relative flex flex-col z-50">
      <AnnouncementBanner variant={bannerVariant} position="static" />

      <header
        className="sticky top-0 z-50 bg-white border-b border-black/10 w-full"
        onMouseLeave={scheduleClose}
      >
        <nav className="w-full px-4 md:px-8">
          <div className="relative flex items-center justify-between h-16 md:h-20 max-w-none">
            <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
              <div className="hidden md:flex items-center gap-3 md:gap-4 lg:gap-6">
                {navItems.map((item) => (
                  <div
                    key={item.key}
                    className="relative h-full flex items-center"
                    onMouseEnter={() => (item.key !== "new" && item.key !== "men" && item.key !== "women") && open(item.key)}
                    onMouseLeave={scheduleClose}
                  >
                    {item.key === "new" ? (
                      <Link
                        href={item.href}
                        prefetch={true}
                        className="text-xs md:text-sm font-light hover:opacity-70 transition-all uppercase text-[#111]"
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <Link
                        href={item.href}
                        prefetch={true}
                        className="text-xs md:text-sm font-light hover:opacity-70 transition-all uppercase text-[#111]"
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              
              <Sheet open={menuOpen} onOpenChange={(open) => {
                setMenuOpen(open);
                if (!open) setMobileMenuState("main");
              }}>
                <SheetTrigger asChild>
                  <button
                    className="md:hidden hover:opacity-70 transition-opacity text-[#111]"
                    aria-label="Menü"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-75 p-0 flex flex-col">
                  <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle className="text-lg font-light uppercase tracking-wide text-[#111] text-left">
                      {mobileMenuState === "main" ? "Menü" :
                        mobileMenuState === "men" ? "Erkek Giyim" : "Kadın Giyim"}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {mobileMenuState === "main" ? (
                      <div className="space-y-4">
                        {navItems.map((item) => (
                          item.key === "men" || item.key === "women" ? (
                            <button
                              key={item.key}
                              onClick={() => setMobileMenuState(item.key as "men" | "women")}
                              className="flex items-center justify-between w-full text-[#111] font-light hover:opacity-70 transition-opacity uppercase text-left"
                            >
                              {item.label}
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            </button>
                          ) : (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              className="block text-[#111] font-light hover:opacity-70 transition-opacity uppercase"
                            >
                              {item.label}
                            </Link>
                          )
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <button
                          onClick={() => setMobileMenuState("main")}
                          className="flex items-center gap-2 text-sm text-[#111]/60 font-medium mb-6 hover:text-[#111] transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Tüm Menü
                        </button>

                        <Link
                          href={mobileMenuState === "men" ? "/men" : "/women"}
                          onClick={() => setMenuOpen(false)}
                          className="block text-[#111] font-medium hover:opacity-70 transition-opacity uppercase border-b border-gray-100 pb-2 mb-4"
                        >
                          Tüm {mobileMenuState === "men" ? "Erkek" : "Kadın"} Giyim
                        </Link>

                        <div className="space-y-1">
                          <p className="text-xs text-[#111]/40 uppercase tracking-widest font-medium mb-3">Kategoriler</p>
                          {categoriesLoading ? (
                            <div className="space-y-3">
                              {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                              ))}
                            </div>
                          ) : activeMobileCategories.map((cat) => (
                              <Link
                                key={cat.id}
                                href={`${mobileMenuState === "men" ? "/men" : "/women"}?category=${cat.slug}`}
                                onClick={() => setMenuOpen(false)}
                                className="block py-2 text-[#111] font-light hover:opacity-70 transition-opacity"
                              >
                                {cat.name}
                              </Link>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t px-6 py-4 space-y-3">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setSearchModalOpen(true);
                      }}
                      className="flex items-center gap-3 text-[#111] font-light hover:opacity-70 transition-opacity w-full"
                    >
                      <Search className="w-5 h-5" />
                      <span>Ara</span>
                    </button>
                    <Link
                      href={session?.user ? "/profile/personal-info" : "/auth-tabs"}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 text-[#111] font-light hover:opacity-70 transition-opacity"
                    >
                      <User className="w-5 h-5" />
                      <span>Hesabım</span>
                    </Link>
                    <Link
                      href={session?.user ? "/favorites" : "/auth-tabs"}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 text-[#111] font-light hover:opacity-70 transition-opacity relative"
                    >
                      <Heart className="w-5 h-5" />
                      <span>Favoriler</span>
                      {favoriteCount > 0 && (
                        <span className="absolute left-5 top-0 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-light bg-[#111]">
                          {favoriteCount}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setCartOpen(true);
                      }}
                      className="flex items-center gap-3 text-[#111] font-light hover:opacity-70 transition-opacity relative w-full"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Sepet</span>
                    </button>

                    
                    <div className="pt-4 border-t">
                      {session?.user ? (
                        <button
                          onClick={async () => {
                            const { signOut } = await import("next-auth/react");
                            await signOut({ redirect: false });
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-center bg-black text-white hover:bg-gray-800 transition-colors rounded-md font-light uppercase tracking-wide text-sm"
                        >
                          Çıkış Yap
                        </button>
                      ) : (
                        <Link
                          href="/auth-tabs"
                          onClick={() => setMenuOpen(false)}
                          className="block w-full px-4 py-2.5 text-center bg-black text-white hover:bg-gray-800 transition-colors rounded-md font-light uppercase tracking-wide text-sm"
                        >
                          Giriş Yap
                        </Link>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              
              <Link
                href="/home"
                className="md:hidden ml-3"
                aria-label="Ana Sayfa"
              >
                <span className="text-xl font-serif font-light tracking-wider text-[#111] whitespace-nowrap">
                  DARK VELVET
                </span>
              </Link>
            </div>

            
            <Link
              href="/home"
              className="hidden md:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
              aria-label="Ana Sayfa"
            >
              <span className="text-2xl md:text-3xl font-serif font-light tracking-wider text-[#111]">
                DARK VELVET
              </span>
            </Link>

            
            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="hidden md:flex hover:opacity-70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded text-[#111] focus-visible:ring-[#111]"
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
                href={session?.user ? "/favorites" : "/auth-tabs"}
                className="relative hover:opacity-70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded text-[#111] focus-visible:ring-[#111]"
                aria-label="Favoriler"
              >
                <Heart className="w-5 h-5" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-light bg-[#111]">
                    {favoriteCount}
                  </span>
                )}
              </Link>
              <button
                ref={cartIconRef}
                onClick={() => {
                  setCartOpen(true);
                }}
                className="relative hover:opacity-70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded text-[#111] focus-visible:ring-[#111]"
                aria-label="Sepet"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-light bg-[#111]">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        
        {openMenu && mega[openMenu] && (
          <div
            className="hidden md:block absolute left-0 right-0 top-full z-50 bg-white border-t border-black/10 shadow-lg"
            onMouseEnter={keepOpen}
            onMouseLeave={scheduleClose}
          >
            <div className="max-w-5xl mx-auto px-8 py-8">
              <div className="flex">
                
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-8">
                  {mega[openMenu].left.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-6">
                      {group.title && (
                        <p className="text-[10px] tracking-[0.4em] uppercase font-bold text-black/40">
                          {group.title}
                        </p>
                      )}
                      <div className="space-y-4">
                        {group.items.map((link, lIdx) => (
                          link.href === "#loading" ? (
                            <Skeleton key={lIdx} className="h-4 w-36" />
                          ) : (
                            <Link
                              key={lIdx}
                              href={link.href}
                              className="block text-sm font-light text-black/70 hover:text-black hover:translate-x-1 transition-all duration-300"
                              onClick={() => setOpenMenu(null)}
                            >
                              {link.label}
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                
                {mega[openMenu].rightPromo && (
                  <div className="w-65 bg-gray-50 border-l border-gray-100 pl-8 flex flex-col justify-center">
                    <Link href={mega[openMenu].rightPromo!.href} className="group block" onClick={() => setOpenMenu(null)}>
                      <div className="relative group/promo overflow-hidden aspect-3/4 mb-6">
                        <Image
                          src={mega[openMenu].rightPromo!.image}
                          alt={mega[openMenu].rightPromo!.title}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover/promo:scale-105"
                          sizes="400px"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/5" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] tracking-[0.4em] uppercase font-bold text-black/30">Öne Çıkan</p>
                        <h4 className="text-xl font-serif font-light">{mega[openMenu].rightPromo!.title}</h4>
                        <span
                          className="inline-flex text-[11px] font-bold tracking-[0.2em] uppercase border-b border-black pb-1 hover:border-black/30 transition-colors"
                        >
                          Keşfet
                        </span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        
        <SearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
        />

        
        <CartPreview
          cartIconRef={cartIconRef}
          headerBottom={81}
        />
      </header>

      
      <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
