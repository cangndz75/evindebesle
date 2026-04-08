"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, ChevronLeft, ChevronRight, Tag, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { useCartStore, type CartItem } from "@/lib/stores/cartStore";

type ProductColor = {
  id: string;
  name: string;
  hexCode?: string | null;
  images: string[];
  variants?: Array<{
    id?: string;
    variantCode?: string | null;
    colorId?: string;
    sizeId?: string;
    stock?: number;
  }>;
};

type RecommendedProduct = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  originalPrice?: number | null;
  description?: string | null;
  detailText?: string | null;
  image: string | null;
  primaryImage: string | null;
  colors?: ProductColor[];
};

type ProductSize = {
  id: string;
  name: string;
  stock: number;
};

type QuickProductDetails = {
  id: string;
  name: string;
  slug: string | null;
  description?: string | null;
  detailText?: string | null;
  price: number;
  originalPrice?: number | null;
  image: string | null;
  primaryImage: string | null;
  secondaryImage?: string | null;
  colors: Array<{
    id: string;
    name: string;
    hexCode?: string | null;
    images: string[];
    variants: Array<{
      id: string;
      variantCode?: string | null;
      colorId: string;
      sizeId: string;
      stock: number;
      price?: number | null;
    }>;
  }>;
  sizes: ProductSize[];
};

type ShoppingCartProps = {
  isOpen: boolean;
  onClose: () => void;
};

function formatPriceTRY(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  );
}

function ProductTile({
  product,
  onNavigate,
  onQuickAdd,
  onQuickDetail,
}: {
  product: RecommendedProduct;
  onNavigate: () => void;
  onQuickAdd: (product: RecommendedProduct, preferredColorId?: string | null) => void;
  onQuickDetail: (product: RecommendedProduct, preferredColorId?: string | null) => void;
}) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(product.colors?.[0]?.id || null);

  useEffect(() => {
    setSelectedColorId(product.colors?.[0]?.id || null);
  }, [product.id, product.colors]);

  const selectedColor = product.colors?.find((color) => color.id === selectedColorId) || product.colors?.[0];
  const productImage =
    selectedColor?.images?.[0] ||
    product.primaryImage ||
    product.image ||
    "/placeholder.jpg";

  const productUrl = product.slug ? `/products/${product.slug}` : `/product/${product.id}`;

  const getSwatchStyle = (color: ProductColor) => {
    if (color.hexCode) {
      return { backgroundColor: color.hexCode };
    }

    const normalized = (color.name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const toneMap: Array<{ keys: string[]; hex: string }> = [
      { keys: ["siyah", "black"], hex: "#000000" },
      { keys: ["ekru", "ecru", "krem", "ivory"], hex: "#e8e1cf" },
      { keys: ["beyaz", "white"], hex: "#f6f6f6" },
      { keys: ["gri", "gray", "grey"], hex: "#a8a8a8" },
      { keys: ["antrasit", "anthracite", "koyu gri"], hex: "#4a4f56" },
      { keys: ["lacivert", "navy"], hex: "#1f2d4f" },
      { keys: ["mavi", "blue"], hex: "#3f5f9f" },
      { keys: ["bej", "beige", "tas"], hex: "#cdbca6" },
      { keys: ["vizon", "kum", "nude"], hex: "#c8b5a1" },
      { keys: ["kahve", "camel", "taba", "brown"], hex: "#8a6642" },
      { keys: ["pembe", "pink", "gul"], hex: "#dba9af" },
      { keys: ["kirmizi", "red", "bordo", "burgundy"], hex: "#8d2f3c" },
      { keys: ["yesil", "green", "haki", "khaki"], hex: "#6d7b52" },
      { keys: ["sari", "yellow", "hardal", "gold"], hex: "#b7923a" },
      { keys: ["mor", "purple", "lila", "lavanta"], hex: "#816d9b" },
      { keys: ["turuncu", "orange", "kiremit", "terracotta"], hex: "#b76846" },
    ];

    const match = toneMap.find((item) => item.keys.some((key) => normalized.includes(key)));
    if (match) {
      return { backgroundColor: match.hex };
    }

    if (color.images?.[0]) {
      return {
        backgroundImage: `url(${color.images[0]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    return { backgroundColor: "#d9d9d9" };
  };

  return (
    <article className="group block w-28 shrink-0" aria-label={product.name}>
      <div className="relative aspect-3/4 overflow-hidden rounded-md bg-[#f5f5f5] ring-1 ring-black/5">
        <Link
          href={productUrl}
          onClick={onNavigate}
          className="absolute inset-0 z-10"
          aria-label={product.name}
        />
        <Image
          src={productImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="112px"
          unoptimized
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-linear-to-t from-black/55 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickAdd(product, selectedColor?.id || null);
            }}
            className="h-7 min-w-24 rounded-full bg-white px-3 text-[10px] font-semibold tracking-widest text-black"
          >
            SEPETE EKLE
          </button>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickDetail(product, selectedColor?.id || null);
            }}
            className="flex h-7 min-w-24 items-center justify-center rounded-full border border-white/85 bg-black/20 px-3 text-[10px] font-semibold tracking-widest text-white"
          >
            DETAYI GOR
          </Link>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="line-clamp-2 text-[12px] leading-4 font-medium text-[#222]">{product.name}</p>
        <p className="text-[12px] font-semibold text-[#1a1a1a]">{formatPriceTRY(product.price)}</p>
        {product.colors && product.colors.length > 0 ? (
          <div className="flex items-center gap-1 pt-1">
            {product.colors.slice(0, 4).map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedColorId(color.id);
                }}
                className={`h-2.5 w-2.5 rounded-full border p-px ${selectedColor?.id === color.id ? "border-black" : "border-[#d4d4d4]"}`}
                aria-label={color.name}
              >
                <span className="block h-full w-full rounded-full" style={getSwatchStyle(color)} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const { data: session } = useSession();

  const cartItems = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const isReady = useCartStore((state) => state.isReady);
  const hydrate = useCartStore((state) => state.hydrate);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const addItemOptimistic = useCartStore((state) => state.addItemOptimistic);

  const [freeShippingThreshold, setFreeShippingThreshold] = useState(99);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<RecommendedProduct[]>([]);
  const [activeTab, setActiveTab] = useState<"recommended" | "recent">("recommended");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickProduct, setQuickProduct] = useState<RecommendedProduct | null>(null);
  const [quickProductDetails, setQuickProductDetails] = useState<QuickProductDetails | null>(null);
  const [quickSelectedColorId, setQuickSelectedColorId] = useState<string | null>(null);
  const [quickSelectedSizeId, setQuickSelectedSizeId] = useState<string | null>(null);
  const [quickQuantity, setQuickQuantity] = useState(1);
  const [quickImageIndex, setQuickImageIndex] = useState(0);
  const router = useRouter();

  const emptySliderRef = useRef<HTMLDivElement | null>(null);
  const filledRecommendedRef = useRef<HTMLDivElement | null>(null);

  const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = 320;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const parseImages = (images: unknown) => {
    if (Array.isArray(images)) return images.filter((img): img is string => typeof img === "string" && !!img);
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) return parsed.filter((img): img is string => typeof img === "string" && !!img);
        return images ? [images] : [];
      } catch {
        return images ? [images] : [];
      }
    }
    return [];
  };

  const getSwatchStyle = (color: { name: string; hexCode?: string | null; images?: string[] }) => {
    if (color.hexCode) {
      return { backgroundColor: color.hexCode };
    }

    const normalized = (color.name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const toneMap: Array<{ keys: string[]; hex: string }> = [
      { keys: ["siyah", "black"], hex: "#000000" },
      { keys: ["ekru", "ecru", "krem", "ivory"], hex: "#e8e1cf" },
      { keys: ["beyaz", "white"], hex: "#f6f6f6" },
      { keys: ["gri", "gray", "grey"], hex: "#a8a8a8" },
      { keys: ["antrasit", "anthracite", "koyu gri"], hex: "#4a4f56" },
      { keys: ["lacivert", "navy"], hex: "#1f2d4f" },
      { keys: ["mavi", "blue"], hex: "#3f5f9f" },
      { keys: ["bej", "beige", "tas"], hex: "#cdbca6" },
      { keys: ["vizon", "kum", "nude"], hex: "#c8b5a1" },
      { keys: ["kahve", "camel", "taba", "brown"], hex: "#8a6642" },
      { keys: ["pembe", "pink", "gul"], hex: "#dba9af" },
      { keys: ["kirmizi", "red", "bordo", "burgundy"], hex: "#8d2f3c" },
      { keys: ["yesil", "green", "haki", "khaki"], hex: "#6d7b52" },
      { keys: ["sari", "yellow", "hardal", "gold"], hex: "#b7923a" },
      { keys: ["mor", "purple", "lila", "lavanta"], hex: "#816d9b" },
      { keys: ["turuncu", "orange", "kiremit", "terracotta"], hex: "#b76846" },
    ];

    const match = toneMap.find((item) => item.keys.some((key) => normalized.includes(key)));
    if (match) {
      return { backgroundColor: match.hex };
    }

    if (color.images?.[0]) {
      return {
        backgroundImage: `url(${color.images[0]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    return { backgroundColor: "#d3d3d3" };
  };

  const getSizeStockForColor = (product: QuickProductDetails, colorId: string | null, sizeId: string) => {
    if (!colorId) {
      const found = product.sizes.find((s) => s.id === sizeId);
      return found?.stock ?? 0;
    }
    const selectedColor = product.colors.find((c) => c.id === colorId);
    if (!selectedColor) {
      const found = product.sizes.find((s) => s.id === sizeId);
      return found?.stock ?? 0;
    }
    const colorVariant = selectedColor.variants.find((v) => v.sizeId === sizeId);
    if (colorVariant) return colorVariant.stock;
    const found = product.sizes.find((s) => s.id === sizeId);
    return found?.stock ?? 0;
  };

  const getSizeRank = (sizeName: string) => {
    const normalized = sizeName.toUpperCase().replace(/\s+/g, "");
    const rankMap: Record<string, number> = {
      XXS: 1,
      XS: 2,
      S: 3,
      M: 4,
      L: 5,
      XL: 6,
      XXL: 7,
      "2XL": 7,
      "3XL": 8,
      "4XL": 9,
    };

    if (rankMap[normalized] !== undefined) {
      return rankMap[normalized];
    }

    if (/^\d+$/.test(normalized)) {
      return 100 + Number(normalized);
    }

    return 1000;
  };

  const getVisibleSortedSizes = (product: QuickProductDetails, colorId: string | null) => {
    return product.sizes
      .filter((size) => getSizeStockForColor(product, colorId, size.id) > 0)
      .sort((a, b) => {
        const rankA = getSizeRank(a.name);
        const rankB = getSizeRank(b.name);
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name, "tr");
      });
  };

  const buildQuickImages = (product: QuickProductDetails) => {
    const selectedColor = product.colors.find((c) => c.id === quickSelectedColorId);
    const list: string[] = [];
    if (selectedColor?.images?.length) {
      selectedColor.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    [product.primaryImage, product.secondaryImage, product.image].forEach((img) => {
      if (img && !list.includes(img)) list.push(img);
    });
    if (list.length === 0) list.push("/placeholder.jpg");
    return list;
  };

  const fetchQuickProductDetails = async (productId: string) => {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) {
      throw new Error("fetch_failed");
    }
    const data = await res.json();
    const details: QuickProductDetails = {
      id: data.id,
      name: data.name,
      slug: data.slug || null,
      description: data.description || null,
      detailText: data.detailText || null,
      price: data.price,
      originalPrice: data.originalPrice || null,
      image: data.image || null,
      primaryImage: data.primaryImage || null,
      secondaryImage: data.secondaryImage || null,
      colors: (data.colors || []).map((color: any) => ({
        id: color.id,
        name: color.name,
        hexCode: color.hexCode || null,
        images: parseImages(color.images),
        variants: Array.isArray(color.variants) ? color.variants : [],
      })),
      sizes: (data.sizes || []).map((size: any) => ({
        id: size.id,
        name: size.name,
        stock: typeof size.stock === "number" ? size.stock : 0,
      })),
    };
    return details;
  };

  const openQuickModal = async (product: RecommendedProduct, preferredColorId?: string | null) => {
    setQuickProduct(product);
    setQuickModalOpen(false);
    setQuickLoading(true);
    setQuickSubmitting(false);
    setQuickQuantity(1);
    setQuickImageIndex(0);
    setQuickSelectedColorId(null);
    setQuickSelectedSizeId(null);
    setQuickProductDetails(null);

    try {
      const details = await fetchQuickProductDetails(product.id);
      setQuickProductDetails(details);

      const initialColorId = details.colors.find((color) => color.id === preferredColorId)?.id || details.colors[0]?.id || null;
      setQuickSelectedColorId(initialColorId);
      const firstAvailableSize = getVisibleSortedSizes(details, initialColorId)[0];
      setQuickSelectedSizeId(firstAvailableSize?.id || null);
      setQuickModalOpen(true);
    } catch {
      toast.error("Ürün bilgisi yuklenemedi");
      setQuickProductDetails(null);
      setQuickModalOpen(false);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleQuickAddInstant = async (product: RecommendedProduct, preferredColorId?: string | null) => {
    try {
      const details = await fetchQuickProductDetails(product.id);
      const initialColor = details.colors.find((color) => color.id === preferredColorId) || details.colors[0] || null;
      const initialSize = getVisibleSortedSizes(details, initialColor?.id || null)[0] || null;
      const productImage = initialColor?.images?.[0] || details.primaryImage || details.image;

      await addItemOptimistic({
        productId: product.id,
        colorId: initialColor?.id || null,
        sizeId: initialSize?.id || null,
        quantity: 1,
        product: {
          id: product.id,
          name: details.name || product.name,
          image: productImage || "/placeholder.jpg",
          price: details.price ?? product.price,
          originalPrice: details.originalPrice || null,
        },
        color: initialColor ? { id: initialColor.id, name: initialColor.name } : null,
        size: initialSize ? { id: initialSize.id, name: initialSize.name } : null,
      });

      toast.success("Ürün sepete eklendi");
    } catch {
      toast.error("Sepete eklenirken bir hata olustu");
    }
  };

  const handleQuickAddToCart = async () => {
    if (!quickProduct || !quickProductDetails) return;
    if (quickSubmitting) return;

    const selectedColor = quickProductDetails.colors.find((c) => c.id === quickSelectedColorId) || null;
    const hasSizes = quickProductDetails.sizes.length > 0;
    const selectedSize = quickProductDetails.sizes.find((s) => s.id === quickSelectedSizeId) || null;

    if (hasSizes && !selectedSize) {
      toast.error("Lutfen beden seciniz");
      return;
    }

    setQuickSubmitting(true);
    try {
      const productImage = selectedColor?.images?.[0] || quickProductDetails.primaryImage || quickProductDetails.image;
      await addItemOptimistic({
        productId: quickProduct.id,
        colorId: selectedColor?.id || null,
        sizeId: selectedSize?.id || null,
        quantity: quickQuantity,
        product: {
          id: quickProduct.id,
          name: quickProductDetails.name || quickProduct.name,
          image: productImage || "/placeholder.jpg",
          price: quickProductDetails.price ?? quickProduct.price,
          originalPrice: quickProductDetails.originalPrice || null,
        },
        color: selectedColor ? { id: selectedColor.id, name: selectedColor.name } : null,
        size: selectedSize ? { id: selectedSize.id, name: selectedSize.name } : null,
      });
      toast.success("Ürün sepete eklendi");
      setQuickModalOpen(false);
    } catch {
      toast.error("Sepete eklenirken bir hata olustu");
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleCreateOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Sepetiniz boş");
      return;
    }

    const addressesRes = await fetch("/api/user-addresses");

    if (addressesRes.status === 401) {
      onClose();
      router.push("/auth-tabs");
      return;
    }

    try {
      onClose();
      router.push("/checkout/summary");
    } catch (error: any) {
      console.error("Order creation error:", error);
      if (!error.message?.includes('401')) {
        toast.error(error.message || "Sipariş oluşturulurken bir hata oluştu");
      }
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const res = await fetch("/api/company-settings");
      if (res.ok) {
        const data = await res.json();
        setFreeShippingThreshold(Number(data.freeShippingThreshold) || 99);
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
    }
  };

  const loadRecommendedProducts = async (items: CartItem[]) => {
    try {
      const productIds = items.map((i) => i.productId);
      const res = await fetch(`/api/products/recommended?productIds=${productIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendedProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading recommended products:", error);
    }
  };

  const loadRecentlyViewed = async () => {
    try {
      const localProducts = getRecentlyViewed();

      const localFormatted = localProducts.map((p) => ({
        id: p.id,
        productId: p.productId,
        name: p.name,
        slug: p.slug || null,
        price: p.price,
        image: p.image || p.primaryImage || null,
        primaryImage: p.primaryImage || p.image || null,
        colors: [],
      }));

      try {
        const productIds = localFormatted.map(p => p.productId).filter(Boolean).join(",");
        const url = productIds ? `/api/products/recent-views?ids=${productIds}` : "/api/products/recent-views";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const apiProducts = Array.isArray(data?.products) ? data.products : [];

          const apiFormatted = apiProducts.map((p: any) => ({
            id: p.id,
            productId: p.id,
            name: p.name,
            slug: p.slug || null,
            price: p.price,
            image: p.primaryImage || p.image || null,
            primaryImage: p.primaryImage || p.image || null,
            colors: p.colors || [],
          }));

          const apiProductIds = new Set(apiFormatted.map((p: any) => p.productId));

          type ProductItem = {
            id: string;
            productId: string;
            name: string;
            slug: string | null;
            price: number;
            image: string | null;
            primaryImage: string | null;
            colors: any[];
          };
          const productMap = new Map<string, ProductItem>();

          localFormatted.forEach((p: ProductItem) => {
            if (apiProductIds.has(p.productId)) {
              productMap.set(p.productId, p);
            }
          });

          apiFormatted.forEach((p: ProductItem) => {
            productMap.set(p.productId, p);
          });

          const combined = Array.from(productMap.values());
          setRecentlyViewedProducts(combined.slice(0, 12));
        } else {
          setRecentlyViewedProducts(localFormatted.slice(0, 12));
        }
      } catch (apiError) {
        console.error("Error fetching API recent views:", apiError);
        setRecentlyViewedProducts(localFormatted.slice(0, 12));
      }
    } catch (error) {
      console.error("Error loading recently viewed products:", error);
      setRecentlyViewedProducts([]);
    }
  };

  const lastRecommendedKeyRef = useRef<string>("");

  useEffect(() => {
    if (isOpen) {
      if (!hydrated) {
        hydrate();
      }
      loadCompanySettings();
    }
  }, [isOpen, hydrated, hydrate]);

  useEffect(() => {
    if (!cartItems.length) {
      lastRecommendedKeyRef.current = "";
      return;
    }

    const key = cartItems.map((item) => item.productId).sort().join(",");
    if (key === lastRecommendedKeyRef.current) return;

    lastRecommendedKeyRef.current = key;
    loadRecommendedProducts(cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === "recent") {
      loadRecentlyViewed();
    } else if (activeTab === "recommended" && cartItems.length === 0 && recommendedProducts.length === 0) {
      loadRecommendedProducts([]);
    }
  }, [isOpen, activeTab, cartItems, recommendedProducts.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleRecentlyViewedUpdated = () => {
      if (activeTab === "recent") {
        loadRecentlyViewed();
      }
    };

    window.addEventListener("recentlyViewedUpdated", handleRecentlyViewedUpdated);
    return () => window.removeEventListener("recentlyViewedUpdated", handleRecentlyViewedUpdated);
  }, [isOpen, activeTab]);


  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = item.product.originalPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const remainingForFreeShipping = useMemo(() => {
    return Math.max(0, freeShippingThreshold - totalPrice);
  }, [freeShippingThreshold, totalPrice]);

  const freeShippingProgress = useMemo(() => {
    if (freeShippingThreshold <= 0) return 0;
    return Math.min(100, (totalPrice / freeShippingThreshold) * 100);
  }, [freeShippingThreshold, totalPrice]);

  const qualifiesForFreeShipping = totalPrice >= freeShippingThreshold;

  const getProductImage = (item: CartItem) => {
    if (item.color?.images) {
      let colorImages: string[] = [];
      if (typeof item.color.images === 'string') {
        try {
          colorImages = JSON.parse(item.color.images);
        } catch {
          colorImages = [item.color.images];
        }
      } else if (Array.isArray(item.color.images)) {
        colorImages = item.color.images;
      }
      if (colorImages.length > 0) {
        return colorImages[0];
      }
    }

    if (item.product.colors?.[0]?.images) {
      let productColorImages: string[] = [];
      if (typeof item.product.colors[0].images === 'string') {
        try {
          productColorImages = JSON.parse(item.product.colors[0].images);
        } catch {
          productColorImages = [item.product.colors[0].images];
        }
      } else if (Array.isArray(item.product.colors[0].images)) {
        productColorImages = item.product.colors[0].images;
      }
      if (productColorImages.length > 0) {
        return productColorImages[0];
      }
    }

    return item.product.primaryImage || item.product.image || "/placeholder.jpg";
  };

  const getProductUrl = (item: CartItem) => {
    if (item.product.slug) return `/products/${item.product.slug}`;
    return `/product/${item.product.id}`;
  };


  const activeList = activeTab === "recommended" ? recommendedProducts : recentlyViewedProducts;
  const itemCount = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 z-100 bg-white">
        <div className="flex h-full flex-col">
          
          <SheetHeader className="px-5 py-4 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1">
                <SheetTitle className="text-base font-semibold tracking-wide uppercase text-gray-800">
                  Sepetim
                </SheetTitle>
                <p className="text-xs text-gray-500">
                  {cartItems.length > 0 ? `${itemCount} ürün` : "Henüz ürün yok"}
                </p>
              </div>
              
            </div>
          </SheetHeader>

          
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
            
            {!isReady && cartItems.length === 0 ? (
              <div className="space-y-4 py-4">
                
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-24 w-24 shrink-0 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-gray-100" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                      <div className="h-3 w-1/3 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                
                {cartItems.length > 0 ? (
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-md bg-white p-1.5 border border-gray-200">
                        <ShoppingBag className="h-4 w-4 text-black" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="text-sm text-gray-700 leading-5">
                          {qualifiesForFreeShipping ? (
                            <span className="font-semibold text-black">
                              Ücretsiz kargo için yeterli tutara ulaştınız.
                            </span>
                          ) : (
                            <>
                              Ücretsiz kargo için{" "}
                              <span className="font-medium text-black">
                                {formatPriceTRY(remainingForFreeShipping)}
                              </span>{" "}
                              daha ekleyin.
                            </>
                          )}
                        </p>
                        {!qualifiesForFreeShipping ? (
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-black transition-all duration-300"
                              style={{ width: `${freeShippingProgress}%` }}
                            />
                          </div>
                        ) : (
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full bg-black" style={{ width: "100%" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                
                {cartItems.length === 0 ? (
                  <div className="pb-4">
                    <div className="rounded-xl border border-black/10 bg-white px-6 py-10 text-center">
                      <p className="text-xl font-semibold tracking-tight text-black">
                        Sepetiniz Boş
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Ürünlere göz atın ve favorilerinizi sepete ekleyin.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-6 h-12 rounded-xl border-black text-black hover:bg-black hover:text-white px-8"
                        onClick={onClose}
                      >
                        Alışverişe Devam Et
                      </Button>
                    </div>

                    
                    <div className="mt-8">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-8 border-b border-black/10 w-full">
                          <button
                            onClick={() => setActiveTab("recommended")}
                            className={[
                              "pb-3 text-sm font-medium transition-colors",
                              activeTab === "recommended"
                                ? "text-black border-b-2 border-black"
                                : "text-gray-500 hover:text-black",
                            ].join(" ")}
                          >
                            Özellikle Sizin İçin
                          </button>
                          <button
                            onClick={() => setActiveTab("recent")}
                            className={[
                              "pb-3 text-sm font-medium transition-colors",
                              activeTab === "recent"
                                ? "text-black border-b-2 border-black"
                                : "text-gray-500 hover:text-black",
                            ].join(" ")}
                          >
                            Son Görüntülenenler
                          </button>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => scrollSlider(emptySliderRef, "left")}
                            className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                            aria-label="Sola kaydır"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollSlider(emptySliderRef, "right")}
                            className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                            aria-label="Sağa kaydır"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="relative mt-4">
                        <div
                          ref={emptySliderRef}
                          className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                          {activeList.slice(0, 10).map((p) => (
                            <ProductTile key={p.id} product={p} onNavigate={onClose} onQuickAdd={handleQuickAddInstant} onQuickDetail={openQuickModal} />
                          ))}
                          {activeList.length === 0 ? (
                            <div className="text-sm text-gray-500 py-6">
                              Gösterilecek ürün yok.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                
                {cartItems.length > 0 ? (
                  <div className="space-y-0 pb-24">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="border-b border-gray-200 py-4"
                      >
                        <div className="flex gap-4">
                          <Link
                            href={getProductUrl(item)}
                            onClick={onClose}
                            className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-gray-50"
                          >
                            <Image
                              src={getProductImage(item)}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="96px"
                              unoptimized
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link
                                  href={getProductUrl(item)}
                                  onClick={onClose}
                                  className="block text-sm font-medium text-gray-900 hover:underline"
                                  title={item.product.name}
                                >
                                  {item.product.name}
                                </Link>
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.color?.name || "Renk"} · {item.size?.name || "Beden"}
                                </p>
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                className="rounded-xl p-2 text-gray-400 hover:text-black hover:bg-black/5 transition-colors"
                                aria-label="Ürünü kaldır"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center rounded-md border border-gray-300 bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="h-8 w-8 grid place-items-center text-black hover:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent"
                                  aria-label="Miktarı azalt"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-7.5 text-center text-sm font-medium text-black">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="h-8 w-8 grid place-items-center text-black hover:bg-black/5"
                                  aria-label="Miktarı artır"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-base font-semibold text-gray-900">
                                  {formatPriceTRY((item.product.originalPrice || item.product.price) * item.quantity)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.quantity} adet
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {recommendedProducts.length > 0 ? (
                      <div className="pt-5 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <SectionTitle
                            title="Bunları da beğenebilirsiniz"
                            subtitle="Kombininizi tamamlayın"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => scrollSlider(filledRecommendedRef, "left")}
                              className="h-7 w-7 rounded-full border border-gray-300 bg-white hover:bg-gray-50 grid place-items-center"
                              aria-label="Sola kaydır"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollSlider(filledRecommendedRef, "right")}
                              className="h-7 w-7 rounded-full border border-gray-300 bg-white hover:bg-gray-50 grid place-items-center"
                              aria-label="Sağa kaydır"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="relative mt-3">
                          <div
                            ref={filledRecommendedRef}
                            className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          >
                            {recommendedProducts.slice(0, 12).map((p) => (
                              <ProductTile key={p.id} product={p} onNavigate={onClose} onQuickAdd={handleQuickAddInstant} onQuickDetail={openQuickModal} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>

          
          {cartItems.length > 0 ? (
            <div className="sticky bottom-0 border-t border-gray-200 bg-white">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-wide text-gray-500">Ara Toplam</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatPriceTRY(totalPrice)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <Button
                    className="w-full h-12 rounded-full bg-black text-white hover:bg-black/90 tracking-wide text-sm"
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? "Yönlendiriliyor..." : "ÖDEMEYE GEÇ"}
                  </Button>

                  <p className="text-[11px] leading-4 text-gray-400 text-center">
                    KDV dahildir · Kargo ücreti ödeme adımında hesaplanır
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>

      <Dialog open={quickModalOpen} onOpenChange={setQuickModalOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-230 p-0 overflow-hidden border border-[#e9e9e9] rounded-2xl">
          <DialogTitle className="sr-only">Ürün Detayı</DialogTitle>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] bg-white">
            <div className="relative min-h-80 md:min-h-140 bg-[#f4f1ed]">
              {(() => {
                const images = quickProductDetails ? buildQuickImages(quickProductDetails) : [quickProduct?.primaryImage || quickProduct?.image || "/placeholder.jpg"];
                const image = images[quickImageIndex] || images[0] || "/placeholder.jpg";
                return (
                  <>
                    <Image
                      src={image}
                      alt={quickProductDetails?.name || quickProduct?.name || "Ürün"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 45vw"
                      unoptimized
                    />
                    <div className="absolute left-4 bottom-4 flex items-center gap-2">
                      {images.slice(0, 4).map((thumb, idx) => (
                        <button
                          key={`${thumb}-${idx}`}
                          type="button"
                          onClick={() => setQuickImageIndex(idx)}
                          className={`relative h-10 w-10 overflow-hidden rounded border ${quickImageIndex === idx ? "border-black" : "border-[#d7d7d7]"}`}
                        >
                          <Image src={thumb} alt="thumb" fill className="object-cover" sizes="40px" unoptimized />
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-5 md:p-7">
              {quickLoading ? (
                <div className="space-y-4">
                  <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                  <div className="h-8 w-52 rounded bg-gray-100 animate-pulse" />
                  <div className="h-5 w-24 rounded bg-gray-100 animate-pulse" />
                  <div className="h-20 w-full rounded bg-gray-100 animate-pulse" />
                </div>
              ) : quickProductDetails ? (
                <div>
                  <p className="text-[12px] font-semibold tracking-[0.16em] text-[#b9ae99] uppercase">Kombin Tamamla</p>
                  <h3 className="mt-2 text-[32px] leading-9 font-light text-[#292929]">{quickProductDetails.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[28px] font-semibold text-[#252525]">{formatPriceTRY(quickProductDetails.price)}</span>
                    {quickProductDetails.originalPrice && quickProductDetails.originalPrice > quickProductDetails.price ? (
                      <span className="text-sm text-[#8f8f8f] line-through">{formatPriceTRY(quickProductDetails.originalPrice)}</span>
                    ) : null}
                  </div>

                  {(quickProductDetails.description || quickProductDetails.detailText) ? (
                    <p className="mt-4 text-sm leading-6 text-[#666] line-clamp-4">
                      {quickProductDetails.description || quickProductDetails.detailText}
                    </p>
                  ) : null}

                  {quickProductDetails.colors.length > 0 ? (
                    <div className="mt-6">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#585858] uppercase">Renk</p>
                        <span className="text-sm text-[#8a8a8a]">{quickProductDetails.colors.find((c) => c.id === quickSelectedColorId)?.name || "Seciniz"}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2.5">
                        {quickProductDetails.colors.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => {
                              setQuickSelectedColorId(color.id);
                              const available = getVisibleSortedSizes(quickProductDetails, color.id)[0];
                              setQuickSelectedSizeId(available?.id || null);
                              setQuickImageIndex(0);
                            }}
                            className={`h-7 w-7 rounded-full border-2 p-0.5 ${quickSelectedColorId === color.id ? "border-[#4d5562]" : "border-[#e6e6e6]"}`}
                            aria-label={color.name}
                          >
                            <span className="block h-full w-full rounded-full" style={getSwatchStyle(color)} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {quickProductDetails.sizes.length > 0 ? (
                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#585858] uppercase">Beden</p>
                        <Link
                          href={quickProductDetails.slug ? `/products/${quickProductDetails.slug}` : `/product/${quickProductDetails.id}`}
                          onClick={onClose}
                          className="text-xs text-[#888] underline underline-offset-2"
                        >
                          Beden Rehberi
                        </Link>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getVisibleSortedSizes(quickProductDetails, quickSelectedColorId).map((size) => {
                          const active = quickSelectedSizeId === size.id;
                          return (
                            <button
                              key={size.id}
                              type="button"
                              onClick={() => setQuickSelectedSizeId(size.id)}
                              className={`h-9 min-w-11 rounded border px-3 text-sm ${active ? "border-black bg-black text-white" : "border-[#dbdbdb] text-[#555] hover:border-black"}`}
                            >
                              {size.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center gap-3">
                    <div className="inline-flex items-center rounded border border-[#dfdfdf] bg-white">
                      <button
                        type="button"
                        onClick={() => setQuickQuantity((prev) => Math.max(1, prev - 1))}
                        className="h-9 w-9 grid place-items-center text-[#888] hover:text-black"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm">{quickQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuickQuantity((prev) => prev + 1)}
                        className="h-9 w-9 grid place-items-center text-[#888] hover:text-black"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2.5">
                    <Button
                      onClick={handleQuickAddToCart}
                      disabled={quickSubmitting}
                      className="h-12 w-full rounded-none bg-black text-white hover:bg-black/90 tracking-[0.15em] text-xs"
                    >
                      {quickSubmitting ? "EKLENIYOR" : "SEPETE EKLE"}
                    </Button>
                    <Link
                      href={quickProductDetails.slug ? `/products/${quickProductDetails.slug}` : `/product/${quickProductDetails.id}`}
                      onClick={() => {
                        setQuickModalOpen(false);
                        onClose();
                      }}
                      className="flex h-11 w-full items-center justify-center border border-[#dddddd] text-xs tracking-[0.15em] text-[#808080]"
                    >
                      ÜRÜNÜ İNCELE
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-sm text-[#777]">Ürün bilgisi bulunamadı.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
