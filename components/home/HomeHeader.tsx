"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu, Search, User, Heart, ShoppingBag, ChevronRight, ChevronLeft } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import ShoppingCart from "@/app/(public)/_components/ShoppingCart";
import SearchModal from "@/components/home/SearchModal";
import CartPreview from "@/components/home/CartPreview";
import { useHeaderStore } from "@/lib/stores/headerStore";
import { useCategories } from "@/hooks/useCategories";

type MenuKey = "men" | "women" | "new" | "collections" | "blog";

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
    { key: "new" as const, label: "YENİ", href: "/category/new" },
    { key: "collections" as const, label: "KOLEKSİYON", href: "/category/collections" },
    { key: "blog" as const, label: "BLOG", href: "/blog" },
] as const;

export default function HomeHeader() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
    const [mobileMenuState, setMobileMenuState] = useState<"main" | "men" | "women">("main");
    const { categories, loading } = useCategories();
    const [cartOpen, setCartOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const closeTimer = useRef<number | null>(null);
    const cartIconRef = useRef<HTMLButtonElement | null>(null);
    const bannerHeight = 36; // AnnouncementBanner height in px

    const {
        cartCount,
        favoriteCount,
        freeShippingThreshold,
        hydrate,
        refreshCartCount,
        refreshFavoriteCount,
    } = useHeaderStore();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > bannerHeight);
        };
        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Check initial state
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        hydrate(session);
    }, [session, hydrate]);

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

    const mega = useMemo<Record<MenuKey, { left: MegaGroup[]; rightPromo: Promo }>>(
        () => ({
            men: {
                left: [
                    {
                        title: "ERKEK GİYİM",
                        items: [
                            { label: "T-Shirt", href: "/category/men-tshirt" },
                            { label: "Sweatshirt", href: "/category/men-sweatshirt" },
                            { label: "Pantolon", href: "/category/men-pants" },
                            { label: "Tümünü Gör", href: "/men" },
                        ],
                    },
                ],
                rightPromo: {
                    title: "Erkek Koleksiyonu",
                    subtitle: "Stil ve konfor",
                    image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1200&auto=format&fit=crop",
                    href: "/men",
                },
            },
            women: {
                left: [
                    {
                        title: "KADIN GİYİM",
                        items: [
                            { label: "Elbise", href: "/category/women-dresses" },
                            { label: "Bluz", href: "/category/women-tops" },
                            { label: "Dış Giyim", href: "/category/women-outerwear" },
                            { label: "Tümünü Gör", href: "/women" },
                        ],
                    },
                ],
                rightPromo: {
                    title: "Kadın Koleksiyonu",
                    subtitle: "Zarif tasarımlar",
                    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
                    href: "/women",
                },
            },
            new: {
                left: [
                    {
                        title: "YENİ GELENLER",
                        items: [
                            { label: "En Yeniler", href: "/category/new" },
                            { label: "Trendler", href: "/category/trends" },
                        ],
                    },
                ],
                rightPromo: {
                    title: "Yeni Sezon",
                    subtitle: "Keşfedin",
                    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
                    href: "/category/new",
                },
            },
            collections: {
                left: [
                    {
                        title: "ÖZEL KOLEKSİYONLAR",
                        items: [
                            { label: "Minimalist", href: "/category/collection-minimalist" },
                            { label: "Dark Edition", href: "/category/collection-dark" },
                        ],
                    },
                ],
                rightPromo: {
                    title: "Dark Collection",
                    subtitle: "Sınırlı sayıda",
                    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop",
                    href: "/category/collections",
                },
            },
            blog: {
                left: [],
                rightPromo: {
                    title: "Fashion Blog",
                    subtitle: "Stil önerileri",
                    image: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?q=80&w=1200&auto=format&fit=crop",
                    href: "/blog",
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
        closeTimer.current = window.setTimeout(() => setOpenMenu(null), 200);
    };

    return (
        <>
            
            <div className="w-full bg-black text-white text-[11px] tracking-[0.18em] uppercase text-center h-9 flex items-center justify-center">
                ÜCRETSİZ KARGO {freeShippingThreshold ? `${Math.round(freeShippingThreshold)}₺+` : "999₺+"}
            </div>

            
            <header
                className={`w-full bg-white border-b border-black/10 transition-all duration-300 ${isScrolled ? "fixed top-0 left-0 right-0 z-[100] shadow-sm" : "relative"
                    }`}
                onMouseLeave={scheduleClose}
            >
                <nav className="w-full px-4 md:px-8">
                    <div className="relative flex items-center justify-between h-16 md:h-20">
                        
                        <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                            
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
                                            prefetch={true}
                                            className="text-xs md:text-sm font-light hover:opacity-70 transition-all uppercase text-[#111]"
                                        >
                                            {item.label}
                                        </Link>
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
                                <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
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
                                                    {loading ? (
                                                        <div className="space-y-3">
                                                            {[1, 2, 3, 4].map(i => (
                                                                <div key={i} className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                                                            ))}
                                                        </div>
                                                    ) : categories.map((cat) => (
                                                        <Link
                                                            key={cat.id}
                                                            href={`/category/${cat.slug}?gender=${mobileMenuState === "men" ? "MALE" : "FEMALE"}`}
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

                            
                            <Link href="/home" className="md:hidden ml-3" aria-label="Ana Sayfa">
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
                                className="hidden md:flex hover:opacity-70 transition-all text-[#111]"
                                aria-label="Ara"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                            <Link
                                href={session?.user ? "/profile/personal-info" : "/auth-tabs"}
                                className="hover:opacity-70 transition-all text-[#111]"
                                aria-label="Hesabım"
                            >
                                <User className="w-5 h-5" />
                            </Link>
                            <Link
                                href={session?.user ? "/favorites" : "/auth-tabs"}
                                className="relative hover:opacity-70 transition-all text-[#111]"
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
                                onClick={() => setCartOpen(true)}
                                className="relative hover:opacity-70 transition-all text-[#111]"
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

                
                {openMenu && (
                    <div
                        className="hidden md:block absolute left-0 right-0 top-full z-50 bg-white border-t border-black/10 shadow-lg"
                        onMouseEnter={keepOpen}
                        onMouseLeave={scheduleClose}
                    >
                        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                            <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-10">
                                    <div className="grid grid-cols-3 gap-6">
                                        {mega[openMenu].left.map((group, idx) => (
                                            <div key={`${openMenu}-${idx}`}>
                                                {group.title && (
                                                    <div className="text-[11px] tracking-[0.22em] uppercase mb-3 text-black/70">
                                                        {group.title}
                                                    </div>
                                                )}
                                                <ul className="space-y-2">
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
                                <div className="col-span-2">
                                    <Link href={mega[openMenu].rightPromo.href} className="group block">
                                        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-2">
                                            <Image
                                                src={mega[openMenu].rightPromo.image}
                                                alt={mega[openMenu].rightPromo.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                sizes="200px"
                                                unoptimized
                                            />
                                        </div>
                                        <h3 className="text-xs font-light text-[#111] mb-0.5">
                                            {mega[openMenu].rightPromo.title}
                                        </h3>
                                        <p className="text-[10px] text-[#111]/60 font-light">
                                            {mega[openMenu].rightPromo.subtitle}
                                        </p>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                
                <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

                
                <CartPreview cartIconRef={cartIconRef} headerBottom={isScrolled ? 80 : 116} />
            </header>

            
            {isScrolled && <div className="h-[100px] md:h-[116px]" />}

            
            <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
}
