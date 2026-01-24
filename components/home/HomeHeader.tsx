"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu, Search, User, Heart, ShoppingBag } from "lucide-react";
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

const navItems = [
    { key: "men" as const, label: "ERKEK", href: "/men" },
    { key: "women" as const, label: "KADIN", href: "/women" },
    { key: "kids" as const, label: "ÇOCUK", href: "/kids" },
    { key: "bundles" as const, label: "PAKETLER", href: "/bundles" },
    { key: "lastcall" as const, label: "SON FIRSAT", href: "/last-call" },
] as const;

export default function HomeHeader() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const closeTimer = useRef<number | null>(null);
    const cartIconRef = useRef<HTMLButtonElement | null>(null);
    const bannerHeight = 36; // AnnouncementBanner height in px

    // Header store'dan state'leri al
    const {
        cartCount,
        favoriteCount,
        freeShippingThreshold,
        hydrate,
        refreshCartCount,
        refreshFavoriteCount,
    } = useHeaderStore();

    // Scroll event listener for sticky behavior
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > bannerHeight);
        };
        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Check initial state
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Store'u hydrate et (sadece bir kez)
    useEffect(() => {
        hydrate(session);
    }, [session, hydrate]);

    // Cart açma event'ini dinle
    useEffect(() => {
        const handleOpenCart = () => {
            setCartOpen(true);
        };
        window.addEventListener('openCart', handleOpenCart);
        return () => window.removeEventListener('openCart', handleOpenCart);
    }, []);

    // Favori güncellemelerini dinle
    useEffect(() => {
        const handleFavoriteUpdate = () => {
            refreshFavoriteCount(session);
        };
        window.addEventListener("favoriteUpdated", handleFavoriteUpdate);
        return () => window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
    }, [session, refreshFavoriteCount]);

    // Sepet güncellemelerini dinle
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
                        title: "KATEGORİLER",
                        items: [
                            { label: "Yeni Çıkanlar", href: "/men/new" },
                            { label: "En Çok Satanlar", href: "/men/best-sellers" },
                            { label: "Aktif Koleksiyon", href: "/men/active" },
                            { label: "Son Fırsat", href: "/men/last-call" },
                            { label: "Tümünü Gör", href: "/men" },
                        ],
                    },
                    {
                        title: "ÜST GİYİM",
                        items: [
                            { label: "Kısa Kollu", href: "/men/tops/short-sleeves" },
                            { label: "Uzun Kollu", href: "/men/tops/long-sleeves" },
                            { label: "Kazak & Sweatshirt", href: "/men/tops/pullovers" },
                            { label: "Atlet", href: "/men/tops/tanks" },
                            { label: "Tüm Üst Giyim", href: "/men/tops" },
                        ],
                    },
                    {
                        title: "ALT GİYİM & AKSESUAR",
                        items: [
                            { label: "Pantolon", href: "/men/bottoms/pants" },
                            { label: "Şort", href: "/men/bottoms/shorts" },
                            { label: "İç Çamaşırı", href: "/men/bottoms/underwear" },
                            { label: "Ayakkabı", href: "/men/accessories/footwear" },
                            { label: "Aksesuarlar", href: "/men/accessories" },
                        ],
                    },
                ],
                rightPromo: {
                    title: "Modern Bir Yenilenme",
                    subtitle: "Gardırobunu yenile",
                    image: "https://images.unsplash.com/photo-1520975958225-2b6b5a2d2676?q=80&w=1200&auto=format&fit=crop",
                    href: "/collections/modern-reset",
                },
            },
            women: {
                left: [
                    {
                        title: "KATEGORİLER",
                        items: [
                            { label: "Yeni Gelenler", href: "/women/new" },
                            { label: "En Çok Satanlar", href: "/women/best-sellers" },
                            { label: "Takım Koleksiyon", href: "/women/sets" },
                            { label: "Son Fırsat", href: "/women/last-call" },
                            { label: "Tümünü Gör", href: "/women" },
                        ],
                    },
                    {
                        title: "ÜRÜNLER",
                        items: [
                            { label: "Sütyen", href: "/women/bras" },
                            { label: "İç Çamaşırı", href: "/women/underwear" },
                            { label: "Şekillendirici", href: "/women/shapewear" },
                            { label: "Body", href: "/women/bodies" },
                            { label: "Lounge Giyim", href: "/women/collections/loungewear" },
                        ],
                    },
                    {
                        title: "KOLEKSİYONLAR",
                        items: [
                            { label: "Seamless", href: "/women/collections/seamless" },
                            { label: "Dantel", href: "/women/collections/lace" },
                            { label: "Aktif", href: "/women/collections/active" },
                        ],
                    },
                ],
                rightPromo: {
                    title: "Modern Takım",
                    subtitle: "Temiz lüks, yükseltilmiş",
                    image: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?q=80&w=1200&auto=format&fit=crop",
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
                    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
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
                    image: "https://images.unsplash.com/photo-1520975682031-a8d9c7b0a0b8?q=80&w=1200&auto=format&fit=crop",
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
                    image: "https://images.unsplash.com/photo-1520975958225-2b6b5a2d2676?q=80&w=1200&auto=format&fit=crop",
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
        closeTimer.current = window.setTimeout(() => setOpenMenu(null), 200);
    };

    return (
        <>
            {/* Announcement Banner - Scrolls away */}
            <div className="w-full bg-black text-white text-[11px] tracking-[0.18em] uppercase text-center h-9 flex items-center justify-center">
                ÜCRETSİZ KARGO {freeShippingThreshold ? `${Math.round(freeShippingThreshold)}₺+` : "999₺+"}
            </div>

            {/* Fixed Navbar - Sticks to top on scroll */}
            <header
                className={`w-full bg-white border-b border-black/10 transition-all duration-300 ${isScrolled ? "fixed top-0 left-0 right-0 z-[100] shadow-sm" : "relative"
                    }`}
                onMouseLeave={scheduleClose}
            >
                <nav className="w-full px-4 md:px-8">
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
                                            prefetch={true}
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
                                <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                                    <SheetHeader className="px-6 pt-6 pb-4 border-b">
                                        <SheetTitle className="text-lg font-light uppercase tracking-wide text-[#111]">
                                            Menü
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
                                            {cartCount > 0 && (
                                                <span className="absolute left-5 top-0 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-light bg-[#111]">
                                                    {cartCount}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {/* Mobile Logo */}
                            <Link href="/home" className="md:hidden ml-3" aria-label="Ana Sayfa">
                                <span className="text-xl font-serif font-light tracking-wider text-[#111] whitespace-nowrap">
                                    DARK VELVET
                                </span>
                            </Link>
                        </div>

                        {/* Orta: Logo - Desktop */}
                        <Link
                            href="/home"
                            className="hidden md:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
                            aria-label="Ana Sayfa"
                        >
                            <span className="text-2xl md:text-3xl font-serif font-light tracking-wider text-[#111]">
                                DARK VELVET
                            </span>
                        </Link>

                        {/* Sağ: İkonlar */}
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

                {/* Desktop Mega Menu */}
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

                {/* Search Modal */}
                <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

                {/* Cart Preview Popup */}
                <CartPreview cartIconRef={cartIconRef} headerBottom={isScrolled ? 80 : 116} />
            </header>

            {/* Spacer when navbar is fixed */}
            {isScrolled && <div className="h-16 md:h-20" />}

            {/* Shopping Cart Sidebar */}
            <ShoppingCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
}
