"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Heart, ShoppingBag, Info, Plus, Minus, ChevronLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ProductReviews from "./ProductReviews";
import { sanitizeHtmlForRender } from "@/lib/security/sanitizeHtml";
import SizeGuideModal from "./SizeGuideModal";
import { addToRecentlyViewed, getRecentlyViewed } from "@/lib/recently-viewed";
import { useCartStore } from "@/lib/stores/cartStore";
import { Button } from "@/components/ui/button";

interface ProductDetailPageProps {
  product?: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    images: string[] | { url: string; badge?: string }[];
    colors: { id?: string; name: string; value: string; description?: string; variant?: string; images?: string[] }[];
    sizes: string[] | { id?: string; name: string; stock: number }[];
    sizeOptions?: { id?: string; name: string; stock?: number }[];
    variants?: { colorId: string | null; sizeId: string | null; stock: number; variantCode: string }[];
    details: string[];
    fabric?: string;
    care?: string;
    washing?: string;
    sizeNotes?: string;
    shipmentType?: string;
    trendyolLink?: string;
    gender?: "MALE" | "FEMALE" | "UNISEX";
    reviews?: { id: string; userName: string; rating: number; comment: string; createdAt: Date | string; colorId?: string; colorName?: string }[];
    category?: string;
    categorySlug?: string;
    washingInstruction?: { id: string; title: string; content: string } | null;
    deliveryInfo?: { id: string; title: string; content: string } | null;
    sizeNote?: { id: string; title: string; content: string } | null;
    sizeGuide?: { id: string; title: string; imageUrl?: string; content?: any } | null;
    modelInfo?: { id: string; title: string; height: string; size: string; gender?: string } | null;
    lookConfiguration?: any;
    parentLookConfigs?: any[];
  };
  hasOrdered?: boolean;
}

const defaultProduct = {
  id: "1",
  slug: "minimal-siyah-gomlek",
  name: "Minimal Siyah Gömlek",
  price: 1250,
  originalPrice: undefined,
  description: "Yumuşak dokusu ve modern kesimiyle gün boyu konfor sağlayan zamansız bir parça.",
  images: [
    { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop", badge: "Popüler" },
    { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop", badge: undefined },
  ],
  colors: [
    { name: "Standart", value: "#000000" },
  ],
  sizes: ["S", "M", "L", "XL"],
  details: [
    "Nefes alabilen hafif kumaş",
    "Düşük omuz modern kalıp",
    "Günlük ve ofis kullanımına uygun",
    "Kolay kombinlenebilir tasarım",
    "Dört mevsim kullanım",
  ],
  fabric: "%100 pamuk poplin",
  care: "30°C hassas yıkama önerilir",
  washing: "Ters çevirerek yıkayınız",
  delivery: "1-3 iş günü içinde teslimat",
  sizeNotes: "Model M beden giymektedir",
  washingInstruction: null,
  deliveryInfo: null,
  sizeNote: null,
  sizeGuide: null,
  modelInfo: null,
};

export default function ProductDetailPage({ product = defaultProduct, hasOrdered = false }: ProductDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedImage, setSelectedImage] = useState(0);

  const initialVariant = searchParams.get("variant");
  const initialColorIndex = product.colors?.findIndex(c => c.variant === initialVariant) ?? 0;
  const [selectedColor, setSelectedColor] = useState(initialColorIndex >= 0 ? initialColorIndex : 0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [emailNotify, setEmailNotify] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [liveStock, setLiveStock] = useState<number | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const selectedColorLabel = product.colors?.[selectedColor]?.name || "";


  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    fabric: false,
    washing: false,
    delivery: false,
    sizeNotes: false,
    modelInfo: true,
  });
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [thumbnailScrollIndex, setThumbnailScrollIndex] = useState(0);

  const addToCart = async (options?: { redirectToPayment?: boolean }) => {
    if (!selectedSize) {
      toast.error("Lütfen bir beden seçin");
      return;
    }

    const selectedColorObj = product.colors?.[selectedColor];
    const selectedSizeObj = product.sizes?.find(
      (s: any) => typeof s === 'object' && s.name === selectedSize
    ) || product.sizeOptions?.find(
      (s: any) => typeof s === 'object' && s.name === selectedSize
    );

    const colorId = selectedColorObj?.id || null;
    const sizeId = (selectedSizeObj && typeof selectedSizeObj === 'object' && 'id' in selectedSizeObj)
      ? (selectedSizeObj.id ?? null)
      : null;

    let firstImage = "";
    if (product.images && product.images.length > 0) {
      const firstImg = product.images[0];
      if (typeof firstImg === 'string') {
        firstImage = firstImg;
      } else if (firstImg && typeof firstImg === 'object' && 'url' in firstImg) {
        firstImage = firstImg.url || "";
      }
    }

    const selectedColorName = selectedColorObj?.name || "";
    const selectedSizeName = typeof selectedSizeObj === 'object' && selectedSizeObj ? selectedSizeObj.name : selectedSize;

    try {
      await useCartStore.getState().addItemOptimistic({
        productId: product.id,
        colorId,
        sizeId,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          image: firstImage,
          price: product.price || 0,
          originalPrice: product.originalPrice,
        },
        color: selectedColorName ? { id: colorId || "", name: selectedColorName } : null,
        size: selectedSizeName ? { id: sizeId || "", name: selectedSizeName } : null,
      });

      if (options?.redirectToPayment) {
        window.location.href = "/payment";
      } else {
        window.dispatchEvent(
          new CustomEvent("itemAddedToCart", {
            detail: {
              product: {
                id: product.id,
                name: product.name,
                image: firstImage,
                price: product.price || 0,
                originalPrice: product.originalPrice,
              },
              size: selectedSizeName || "",
              color: selectedColorName || "",
            },
          })
        );
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Bir hata oluştu");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const getCurrentColorImages = () => {
    const currentColor = product.colors?.[selectedColor];
    if (currentColor?.images && currentColor.images.length > 0) {
      let parsedImages: string[] = [];
      if (typeof currentColor.images === 'string') {
        try {
          parsedImages = JSON.parse(currentColor.images);
        } catch {
          parsedImages = [currentColor.images];
        }
      } else if (Array.isArray(currentColor.images)) {
        parsedImages = currentColor.images;
      }

      if (parsedImages.length > 0) {
        return parsedImages.map((img) => ({ url: img, badge: undefined }));
      }
    }
    if (product.images && product.images.length > 0) {
      const formattedImages = product.images.map((img) => {
        if (typeof img === 'string') {
          return { url: img, badge: undefined };
        }
        return img;
      });
      return formattedImages;
    }
    const fallbackImage = (product as any).primaryImage || (product as any).image;
    if (fallbackImage) {
      return [{ url: fallbackImage, badge: undefined }];
    }
    return [];
  };

  const handleColorChange = (idx: number) => {
    setSelectedColor(idx);
    setSelectedImage(0); // İlk fotoğrafa dön
    setSelectedSize(""); // Beden seçimini sıfırla (yeni renk için)
    setQuantity(1); // Adeti 1'e sıfırla
    setThumbnailScrollIndex(0); // Thumbnail scroll'u sıfırla

    const selectedColorObj = product.colors?.[idx];
    const variantCode = selectedColorObj?.variant;
    const slug = (product as any).slug || product.id;

    if (variantCode) {
      router.push(`/products/${slug}?variant=${variantCode}`, { scroll: false });
    } else {
      router.push(`/products/${slug}`, { scroll: false });
    }
  };

  const getSizeStock = (sizeName: string): number => {
    if (!product.sizes || product.sizes.length === 0) return 0;
    if (typeof product.sizes[0] === 'string') return 0;
    const sizeObj = product.sizes.find((s: any) =>
      typeof s === 'object' && s.name === sizeName
    ) as { name: string; stock: number } | undefined;
    return sizeObj?.stock || 0;
  };

  const getVariantStock = (sizeName: string): number => {
    const sizeStock = getSizeStock(sizeName);
    if (sizeStock > 0) {
      return sizeStock;
    }

    const currentColor = product.colors?.[selectedColor];
    if (currentColor?.id && product.variants) {
      const sizeObj = product.sizes?.find((s: any) =>
        typeof s === 'object' && s.name === sizeName
      );
      const sizeId = sizeObj && typeof sizeObj === 'object' && 'id' in sizeObj ? sizeObj.id : null;

      if (sizeId) {
        const variant = product.variants.find((v) =>
          v.colorId === currentColor.id && v.sizeId === sizeId
        );
        if (variant && variant.stock > 0) {
          return variant.stock;
        }
      }

      const colorVariant = product.variants.find((v) =>
        v.colorId === currentColor.id && !v.sizeId
      );
      if (colorVariant && colorVariant.stock > 0) {
        return colorVariant.stock;
      }
    }

    return 0;
  };

  const ALPHA_SIZE_ORDER = [
    "XXXXS",
    "XXXS",
    "XXS",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL",
    "XXXXL",
    "XXXXXL",
  ];

  const normalizeAlphaSize = (value: string): string => {
    const compact = value.replace(/\s+/g, "").toUpperCase();
    const xlMatch = compact.match(/^(\d)XL$/);
    if (xlMatch) {
      const xCount = Number(xlMatch[1]);
      if (xCount >= 1 && xCount <= 6) {
        return `${"X".repeat(xCount)}L`;
      }
    }
    return compact;
  };

  const compareSizeNames = (aRaw: string, bRaw: string): number => {
    const a = aRaw.trim();
    const b = bRaw.trim();

    const aCup = a.toUpperCase().match(/^(\d+)\s*([A-Z]+)$/);
    const bCup = b.toUpperCase().match(/^(\d+)\s*([A-Z]+)$/);
    if (aCup && bCup) {
      if (aCup[2] !== bCup[2]) {
        return aCup[2].localeCompare(bCup[2], "tr", { sensitivity: "base" });
      }
      return Number(aCup[1]) - Number(bCup[1]);
    }

    const aAlpha = normalizeAlphaSize(a);
    const bAlpha = normalizeAlphaSize(b);
    const aAlphaIndex = ALPHA_SIZE_ORDER.indexOf(aAlpha);
    const bAlphaIndex = ALPHA_SIZE_ORDER.indexOf(bAlpha);
    if (aAlphaIndex !== -1 && bAlphaIndex !== -1) {
      return aAlphaIndex - bAlphaIndex;
    }

    const aNum = Number(a);
    const bNum = Number(b);
    const aIsNum = !Number.isNaN(aNum) && /^\d+(\.\d+)?$/.test(a);
    const bIsNum = !Number.isNaN(bNum) && /^\d+(\.\d+)?$/.test(b);
    if (aIsNum && bIsNum) {
      return aNum - bNum;
    }

    if (aAlphaIndex !== -1) return -1;
    if (bAlphaIndex !== -1) return 1;
    if (aCup) return -1;
    if (bCup) return 1;
    if (aIsNum) return -1;
    if (bIsNum) return 1;

    return a.localeCompare(b, "tr", { numeric: true, sensitivity: "base" });
  };

  const getAvailableSizesForColor = (): string[] | Array<{ id?: string; name: string; stock?: number }> => {
    if (Array.isArray(product.sizes) && product.sizes.length > 0 && typeof product.sizes[0] === "string") {
      return [...(product.sizes as string[])].sort(compareSizeNames);
    }

    if (Array.isArray(product.sizes) && product.sizes.length > 0 && typeof product.sizes[0] === "object") {
      return [...(product.sizes as Array<{ id?: string; name: string; stock: number }>)].sort((a, b) =>
        compareSizeNames(a.name, b.name)
      );
    }

    if (Array.isArray(product.sizeOptions) && product.sizeOptions.length > 0) {
      return [...(product.sizeOptions as Array<{ id?: string; name: string; stock?: number }>)].sort((a, b) =>
        compareSizeNames(a.name, b.name)
      );
    }

    return [];
  };

  const handleStockNotify = async () => {
    if (!emailNotify || !selectedSize) return;
    try {
      const res = await fetch("/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          size: selectedSize,
          email: emailNotify,
        }),
      });
      if (res.ok) {
        alert("Stoka girince size mail gönderilecek!");
        setEmailNotify("");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (!selectedSize) {
      const availableSizes = getAvailableSizesForColor();
      for (const sizeObj of availableSizes) {
        const sizeName = typeof sizeObj === 'string' ? sizeObj : sizeObj.name;
        const stock = getVariantStock(sizeName);
        if (stock > 0) {
          setSelectedSize(sizeName);
          break;
        }
      }
    }
  }, [product.id, selectedColor]);

  useEffect(() => {
    if (!selectedSize) {
      const availableSizes = getAvailableSizesForColor();

      for (const sizeObj of availableSizes) {
        const sizeName = typeof sizeObj === 'string' ? sizeObj : sizeObj.name;
        const stock = getVariantStock(sizeName);
        if (stock > 0) {
          setSelectedSize(sizeName);
          break;
        }
      }
    }
  }, [product.id, selectedColor]);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const res = await fetch(`/api/favorites/check?productId=${product.id}`);
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };
    checkFavorite();
  }, [product.id]);

  useEffect(() => {
    let firstImage: string | null = null;
    if ((product as any).primaryImage) {
      firstImage = (product as any).primaryImage;
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImg = product.images[0];
      if (typeof firstImg === 'string') {
        firstImage = firstImg;
      } else if (firstImg && typeof firstImg === 'object' && 'url' in firstImg) {
        firstImage = firstImg.url || null;
      }
    } else if ((product as any).image) {
      firstImage = (product as any).image;
    }

    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: (product as any).slug,
      price: product.price,
      image: firstImage,
      primaryImage: (product as any).primaryImage || firstImage || null,
    });

    const recordView = async () => {
      try {
        await fetch(`/api/products/${product.id}/view`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Error recording view:", error);
      }
    };
    recordView();
  }, [product.id]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollPosition > 300 && scrollPosition + windowHeight < documentHeight - 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!selectedSize) return;

    const checkStock = async () => {
      try {
        const currentColor = product.colors?.[selectedColor]; // 0 dahil çalışır
        const sizeObj = product.sizes?.find(
          (s: any) => typeof s === "object" && s.name === selectedSize
        ) || product.sizeOptions?.find(
          (s: any) => typeof s === "object" && s.name === selectedSize
        );

        if (currentColor?.id && sizeObj && typeof sizeObj === "object" && "id" in sizeObj) {
          const res = await fetch(
            `/api/products/${product.id}/stock?colorId=${currentColor.id}&sizeId=${(sizeObj as any).id}`
          );
          if (res.ok) {
            const data = await res.json();
            setLiveStock(data.stock || 0);
            return;
          }
        }

        setLiveStock(getVariantStock(selectedSize));
      } catch {
        setLiveStock(getVariantStock(selectedSize));
      }
    };

    checkStock();
    const interval = setInterval(checkStock, 30000); // Her 30 saniyede bir kontrol et
    return () => clearInterval(interval);
  }, [selectedSize, selectedColor, product.id]);

  const toggleFavorite = async () => {
    setIsLoadingFavorite(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?productId=${product.id}`, {
          method: "DELETE",
        });
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        setIsFavorite(true);
      }
      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    const currentColorImages = getCurrentColorImages();

    if (isLeftSwipe) {
      setSelectedImage((prev) => {
        const maxIndex = currentColorImages.length - 1;
        return prev < maxIndex ? prev + 1 : 0;
      });
    }
    if (isRightSwipe) {
      setSelectedImage((prev) => (prev > 0 ? prev - 1 : currentColorImages.length - 1));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="w-full min-h-screen bg-white pt-1.25 md:pt-5">
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-4">
        <nav className="flex items-center gap-2 text-sm font-light text-gray-500">
          
          {product.gender && (
            <>
              <Link
                href={product.gender === "MALE" ? "/men" : product.gender === "FEMALE" ? "/women" : "/home"}
                className="hover:text-black transition-colors"
              >
                {product.gender === "MALE" ? "Erkek" : product.gender === "FEMALE" ? "Kadın" : "Unisex"}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}

          
          {product.category && product.categorySlug && (
            <>
              <Link
                href={`/category/${product.categorySlug}`}
                className="hover:text-black transition-colors"
              >
                {product.category}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}

          <span className="text-black">{product.name}</span>
        </nav>
      </div>

      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          <div className="flex flex-col lg:flex-row gap-4 lg:max-w-150">
            
            <div className="flex lg:flex-col gap-2 order-2 lg:order-1 relative">
              {getCurrentColorImages().length > 0 ? (
                <>
                  
                  {getCurrentColorImages().length > 4 && (
                    <button
                      onClick={() => setThumbnailScrollIndex(Math.max(0, thumbnailScrollIndex - 1))}
                      disabled={thumbnailScrollIndex === 0}
                      className="hidden lg:flex absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 w-8 h-8 items-center justify-center bg-white border border-gray-300 hover:border-black transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Yukarı kaydır"
                    >
                      <ChevronLeft className="w-4 h-4 rotate-90" />
                    </button>
                  )}

                  <div className="flex lg:flex-col gap-2 overflow-hidden">
                    {getCurrentColorImages().slice(thumbnailScrollIndex, thumbnailScrollIndex + 4).map((img, displayIdx) => {
                      const actualIdx = thumbnailScrollIndex + displayIdx;
                      const imageUrl = typeof img === 'string' ? img : img.url;
                      return (
                        <button
                          key={actualIdx}
                          onClick={() => setSelectedImage(actualIdx)}
                          className={`relative w-16 h-20 lg:w-20 lg:h-24 shrink-0 overflow-hidden border-2 transition-all ${selectedImage === actualIdx
                            ? "border-black"
                            : "border-transparent hover:border-gray-300"
                            }`}
                        >
                          <Image
                            src={imageUrl}
                            alt={`Dark Velvet ${product.name} ${selectedColorLabel} urun gorseli ${actualIdx + 1}`.trim()}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </button>
                      );
                    })}
                  </div>

                  
                  {getCurrentColorImages().length > 4 && (
                    <button
                      onClick={() => setThumbnailScrollIndex(Math.min(getCurrentColorImages().length - 4, thumbnailScrollIndex + 1))}
                      disabled={thumbnailScrollIndex >= getCurrentColorImages().length - 4}
                      className="hidden lg:flex absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-2 w-8 h-8 items-center justify-center bg-white border border-gray-300 hover:border-black transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Aşağı kaydır"
                    >
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </button>
                  )}
                </>
              ) : (
                <div className="w-16 h-20 lg:w-20 lg:h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  Fotoğraf Yok
                </div>
              )}
            </div>

            
            <div className="order-1 lg:order-2 flex-1 min-w-0 relative">
              <div
                ref={imageContainerRef}
                className="relative w-full aspect-3/4 group overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {(() => {
                  const currentColorImages = getCurrentColorImages();
                  if (currentColorImages.length === 0) {
                    return (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        Fotoğraf Yok
                      </div>
                    );
                  }
                  const currentImage = currentColorImages[selectedImage] || currentColorImages[0];
                  const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage.url;
                  const imageBadge = typeof currentImage === 'string' ? undefined : currentImage.badge;

                  return (
                    <>
                      <Image
                        src={imageUrl}
                        alt={`Dark Velvet ${product.name} ${selectedColorLabel}`.trim()}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />

                      
                      {imageBadge && (
                        <div className="absolute top-3 left-3 bg-white text-black text-[10px] px-2 py-1 uppercase font-light">
                          {imageBadge}
                        </div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite();
                        }}
                        disabled={isLoadingFavorite}
                        className="absolute bottom-3 right-3 md:hidden bg-white rounded-full p-2 hover:opacity-70 transition-opacity z-10"
                      >
                        <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-black"}`} />
                      </button>
                    </>
                  );
                })()}
                
                <button
                  onClick={() => {
                    const currentColorImages = getCurrentColorImages();
                    setSelectedImage((prev) => (prev > 0 ? prev - 1 : currentColorImages.length - 1));
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 md:hidden bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                  aria-label="Önceki görsel"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const currentColorImages = getCurrentColorImages();
                    const maxIndex = currentColorImages.length - 1;
                    setSelectedImage((prev) => (prev < maxIndex ? prev + 1 : 0));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 md:hidden bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                  aria-label="Sonraki görsel"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          
          <div className="flex flex-col justify-start pt-8 lg:pt-0">
            
            <div className="hidden md:flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-serif font-light text-black">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                 {product.trendyolLink && (
                  <a
                    href={product.trendyolLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-orange-500 text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    Trendyol'da Gör
                  </a>
                 )}
                <button
                  onClick={toggleFavorite}
                  disabled={isLoadingFavorite}
                  className="hover:opacity-70 transition-opacity shrink-0"
                  aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-black"}`} />
                </button>
              </div>
            </div>

            
            <div className="mb-4 flex flex-col items-start gap-1">
              <div className="flex items-center">
                {product.originalPrice && product.originalPrice > product.price ? (
                  <>
                    <span className="text-2xl md:text-3xl font-light text-black">
                      {product.price} ₺
                    </span>
                    <span className="text-lg line-through ml-3 text-gray-400">
                      {product.originalPrice} ₺
                    </span>
                  </>
                ) : (
                  <span className="text-2xl md:text-3xl font-light text-black">
                    {product.price} ₺
                  </span>
                )}
              </div>
              
              {product.trendyolLink && (
                <a
                  href={product.trendyolLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="md:hidden mt-2 inline-flex items-center gap-2 border border-orange-500 text-orange-500 hover:bg-orange-50 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                >
                  Trendyol'da Gör
                </a>
              )}
            </div>

            
            {product.reviews && product.reviews.length > 0 && (() => {
              const averageRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
              const reviewCount = product.reviews.length;
              return (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(averageRating) ? "fill-black" : "fill-gray-300"}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-light">
                    {reviewCount} Yorum
                  </span>
                </div>
              );
            })()}

            
            <p className="text-base text-gray-700 font-light leading-relaxed mb-8 max-w-lg">
              {product.colors?.[selectedColor]?.description || product.description}
            </p>

            
            <div className="hidden md:block mb-8">
              <p className="text-sm font-light text-black mb-3">
                Renk: <span className="font-normal">{product.colors?.[selectedColor]?.name || "Renk seçilmedi"}</span>
              </p>
              <div className="flex gap-3">
                {product.colors?.map((color, idx) => {
                  let colorImage: string | null = null;

                  if ((color as any).image) {
                    colorImage = (color as any).image;
                  }
                  else if (color.images) {
                    if (typeof color.images === 'string') {
                      try {
                        const parsed = JSON.parse(color.images);
                        colorImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
                      } catch {
                        colorImage = color.images;
                      }
                    }
                    else if (Array.isArray(color.images) && color.images.length > 0) {
                      colorImage = color.images[0];
                    }
                  }

                  if (!colorImage && getCurrentColorImages().length > 0) {
                    const firstImage = getCurrentColorImages()[0];
                    colorImage = typeof firstImage === 'string' ? firstImage : firstImage.url;
                  }

                  return (
                    <div key={idx} className="relative group">
                      <button
                        onClick={() => handleColorChange(idx)}
                        className={`relative w-16 h-20 overflow-hidden border transition-all rounded ${selectedColor === idx
                          ? "border-[#111]"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                        aria-label={color.name}
                      >
                        {colorImage ? (
                          <Image
                            src={colorImage}
                            alt={`Dark Velvet ${product.name} ${color.name} renk secenegi`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: color.value }}
                          />
                        )}
                      </button>
                      
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs font-light whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {color.name}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            
            <div className="mb-8">
              <div className="mb-4">
                <p className="text-sm font-light text-black mb-3">
                  Beden: <span className="text-gray-500">{selectedSize || "Seçiniz"}</span>
                </p>

                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    const availableSizes = getAvailableSizesForColor();
                    if (availableSizes.length === 0) {
                      return (
                        <p className="text-sm text-gray-500">Bu renk için beden seçeneği bulunmuyor.</p>
                      );
                    }

                    return availableSizes.map((sizeObj) => {
                      const sizeName = typeof sizeObj === 'string' ? sizeObj : sizeObj.name;
                      const stock = getVariantStock(sizeName);
                      const isOutOfStock = stock <= 0;
                      const isSelected = selectedSize === sizeName;

                      return (
                        <button
                          key={sizeName}
                          onClick={() => !isOutOfStock && setSelectedSize(sizeName)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 text-sm font-light border transition-all ${isSelected
                            ? "bg-[#111] text-white border-[#111]"
                            : isOutOfStock
                              ? "border-gray-200 text-gray-400 line-through cursor-not-allowed bg-white"
                              : "bg-white border-gray-300 hover:border-gray-500 text-black"
                            }`}
                        >
                          {sizeName}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              
              
              <div className="mb-6">
                {product.modelInfo && (
                  <p className="text-xs text-gray-600 font-light mb-2">
                    {product.modelInfo.title}
                    {product.modelInfo.height && ` - Boy: ${product.modelInfo.height}`}
                    {product.modelInfo.size && ` - Beden: ${product.modelInfo.size}`}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-gray-600 hover:text-black underline font-light"
                  >
                    Beden Rehberi
                  </button>
                  <span className="text-gray-300">|</span>
                  <button className="text-gray-600 hover:text-black underline font-light">
                    Bedenimi Bul
                  </button>
                </div>
              </div>
            </div>

            
            {(() => {

              if (selectedSize) {
                const stock = getVariantStock(selectedSize);

                if (stock <= 0) {
                  return (
                    <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-sm text-gray-700 mb-2">Bu beden şu anda stokta yok.</p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="E-posta adresiniz"
                          value={emailNotify}
                          onChange={(e) => setEmailNotify(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                        />
                        <button
                          onClick={handleStockNotify}
                          disabled={!emailNotify}
                          className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Haber Ver
                        </button>
                      </div>
                    </div>
                  );
                } else if (stock < 5) {
                  return (
                    <div className="mb-4">
                      <span className="text-red-600 text-sm font-medium animate-pulse">
                        Son {stock} ürün!
                      </span>
                    </div>
                  );
                }
              }
              return null;
            })()}

            
            <div className="flex items-center gap-4 mb-8">
              
              <div className="flex items-center border border-gray-300 h-14">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-4 h-full text-black hover:bg-gray-100 transition-colors font-light flex items-center justify-center disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 h-full text-sm font-light text-black border-x border-gray-300 min-w-15 text-center flex items-center justify-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="px-4 h-full text-black hover:bg-gray-100 transition-colors font-light flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              
              <button
                onClick={() => addToCart()}
                disabled={!selectedSize || getVariantStock(selectedSize) <= 0}
                className="flex-1 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold h-14 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sepete Ekle
              </button>
            </div>
          </div>

        </div>
      </div>



      
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 border-t border-gray-200">
        <div className="space-y-0">
          
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("details")}
              className="w-full flex items-center justify-between py-6 text-left"
            >
              <h3 className="text-base font-light text-black">Ürün Detayı</h3>
              {expandedSections.details ? (
                <Minus className="w-5 h-5 text-gray-400" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.details && (
              <div className="pb-6 space-y-2">
                {product.details.map((detail, idx) => (
                  <p key={idx} className="text-sm text-gray-700 font-light">
                    {detail}
                  </p>
                ))}
                {product.modelInfo && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-sm mb-2">Model Bilgisi</h4>
                    <p className="text-sm text-gray-700 font-light">{product.modelInfo.title}</p>
                  </div>
                )}
              </div>
            )}
          </div>

            {product.shipmentType && (
              <div className="bg-gray-50 p-4 border-l-2 border-black mb-8 flex items-center justify-between">
                <span className="text-sm font-medium text-black">Kargo & Teslimat</span>
                <span className="text-sm font-light text-gray-700">{product.shipmentType}</span>
              </div>
            )}

            
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("fabric")}
              className="w-full flex items-center justify-between py-6 text-left"
            >
              <h3 className="text-base font-light text-black">Kumaş ve Bakım</h3>
              {expandedSections.fabric ? (
                <Minus className="w-5 h-5 text-gray-400" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.fabric && (
              <div className="pb-6">
                <p className="text-sm text-gray-700 font-light">{product.fabric}</p>
                <p className="text-sm text-gray-700 font-light mt-2">{product.care}</p>
              </div>
            )}
          </div>

          
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("washing")}
              className="w-full flex items-center justify-between py-6 text-left"
            >
              <h3 className="text-base font-light text-black">Yıkama Talimatları</h3>
              {expandedSections.washing ? (
                <Minus className="w-5 h-5 text-gray-400" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.washing && (
              <div className="pb-6">
                <div
                  className="text-sm text-gray-700 font-light prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(product.washingInstruction?.content || product.washing || "") }}
                />
              </div>
            )}
          </div>

          
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("delivery")}
              className="w-full flex items-center justify-between py-6 text-left"
            >
              <h3 className="text-base font-light text-black">Teslimat ve İade</h3>
              {expandedSections.delivery ? (
                <Minus className="w-5 h-5 text-gray-400" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.delivery && (
              <div className="pb-6">
                <div
                  className="text-sm text-gray-700 font-light prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(product.deliveryInfo?.content || (product as any).delivery || "") }}
                />
              </div>
            )}
          </div>

          
          {product.variants && product.variants.length > 0 && (
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection("variants")}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <h3 className="text-base font-light text-black">Varyant Beden Bilgileri</h3>
                {expandedSections.variants ? (
                  <Minus className="w-5 h-5 text-gray-400" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {expandedSections.variants && (
                <div className="pb-6 overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-light">
                        <th className="py-2 px-3">Beden</th>
                        <th className="py-2 px-3">Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants
                        .filter(v => v.colorId === product.colors?.[selectedColor]?.id)
                        .map((v: any, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-700">
                            {(() => {
                               const sz = product.sizes?.find((s: any) => typeof s === 'object' && s.id === v.sizeId);
                               return (sz && typeof sz === 'object') ? sz.name : "-";
                            })()}
                          </td>
                          <td className="py-2 px-3 text-gray-700">
                            {v.stock > 0 ? (
                                <span className="text-green-600 font-medium">{v.stock} Adet</span>
                              ) : (
                                <span className="text-red-500">Tükendi</span>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("sizeNotes")}
              className="w-full flex items-center justify-between py-6 text-left"
            >
              <h3 className="text-base font-light text-black">Beden Notları</h3>
              {expandedSections.sizeNotes ? (
                <Minus className="w-5 h-5 text-gray-400" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.sizeNotes && (
              <div className="pb-6">
                <div
                  className="text-sm text-gray-700 font-light prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(product.sizeNote?.content || product.sizeNotes || "") }}
                />
              </div>
            )}
          </div>
        </div>
      </div >

      
      < ProductReviews
        productId={product.id}
        productName={product.name}
        productImage={(() => {
          if ((product as any).primaryImage) return (product as any).primaryImage;
          if (product.images && product.images.length > 0) {
            const firstImg = product.images[0];
            if (typeof firstImg === 'string') return firstImg;
            if (firstImg && typeof firstImg === 'object' && 'url' in firstImg) return firstImg.url;
          }
          return (product as any).image || null;
        })()
        }
        selectedColorId={product.colors?.[selectedColor]?.id}
        reviews={product.reviews || []}
        hasOrdered={hasOrdered}
      />

      
      {product.lookConfiguration && product.lookConfiguration.items && product.lookConfiguration.items.length > 0 && (
        <LookConfigurationSection config={product.lookConfiguration} />
      )}
 
      
      {product.parentLookConfigs && product.parentLookConfigs.length > 0 && (
        <ParentLookConfigsSection configs={product.parentLookConfigs} />
      )}

      
      <RecentlyViewedSection currentProductId={product.id} />

      
      <SizeGuideModal
        open={sizeGuideOpen}
        onOpenChange={setSizeGuideOpen}
        sizeGuide={
          (product.sizeGuide?.content as any) || {
            productName: product.name,
            measurements: [],
          }
        }
      />
    </div>
  );
}

function LookConfigurationSection({ config }: { config: any }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
 
  if (!config.isVisible) return null;
 
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollPrev(scrollLeft > 0);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 10);
  };
 
  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };
 
  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };
 
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 border-t border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div className="space-y-4">
          <span className="text-[10px] tracking-[0.4em] uppercase font-bold text-black/40">Kombininizi Tamamlayın</span>
          <h2 className="text-3xl md:text-4xl font-serif font-light text-black">
            {config.title || "Takımı Tamamla"}
          </h2>
        </div>
        {config.showAllAddButton && (
          <Button variant="outline" className="rounded-full px-8 h-12 border-black text-black font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-black hover:text-white transition-all hidden md:flex">
            Tüm Parçaları İncele
          </Button>
        )}
      </div>
 
      <div className="relative">
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8"
        >
          {config.items.map((item: any) => (
            <Link 
              key={item.id} 
              href={`/products/${item.product.slug}`} 
              className="shrink-0 w-64 md:w-72 snap-start group"
            >
              <div className="relative aspect-3/4 mb-6 overflow-hidden bg-gray-50 group-hover:shadow-xl transition-all duration-700">
                {config.showDiscountBadge && <div className="absolute top-4 left-4 bg-black text-white text-[10px] px-2 py-1 uppercase z-10">İndirim</div>}
                <Image
                  src={item.product.primaryImage || item.product.image || "/placeholder.jpg"}
                  alt={`Dark Velvet ${item.product.name}`}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 768px) 256px, 288px"
                />
                
                
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold tracking-[0.3em] uppercase border-b border-white pb-1">İncele</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-light text-black/60 uppercase tracking-widest truncate group-hover:text-black transition-colors">
                  {item.product.name}
                </h3>
                {config.showTotalPrice && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-medium">{item.product.price.toLocaleString('tr-TR')} ₺</span>
                    {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                      <span className="text-[11px] text-black/30 line-through">
                        {item.product.originalPrice.toLocaleString('tr-TR')} ₺
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
 
        
        {config.items.length > 4 && (
          <>
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-2 md:-translate-x-4 bg-white border border-gray-100 p-3 hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-0 shadow-xl z-20 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-2 md:translate-x-4 bg-white border border-gray-100 p-3 hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-0 shadow-xl z-20 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      {config.showAllAddButton && (
        <div className="mt-8 flex md:hidden">
          <Button variant="outline" className="w-full rounded-full h-14 border-black text-black font-bold uppercase text-xs tracking-widest">
            Tüm Parçaları İncele
          </Button>
        </div>
      )}
    </section>
  );
}

function RecentlyViewedSection({ currentProductId }: { currentProductId?: string }) {
  const [viewedProducts, setViewedProducts] = useState<Array<{
    id: string;
    productId: string;
    name: string;
    slug?: string;
    price: number;
    image: string | null;
  }>>([]);

  useEffect(() => {
    const loadRecentlyViewed = async () => {
      if (typeof window === "undefined") return;

      try {
        const localProducts = getRecentlyViewed();

        const localFormatted = localProducts
          .filter((p) => p.productId !== currentProductId) // Mevcut ürünü filtrele
          .map((p: {
            id: string;
            productId: string;
            name: string;
            slug?: string;
            price: number;
            image: string | null;
            primaryImage: string | null;
          }) => ({
            id: p.id,
            productId: p.productId,
            name: p.name,
            slug: p.slug,
            price: p.price,
            image: p.image || p.primaryImage || null,
          }));

        try {
          const productIds = localFormatted.map((p: any) => p.productId).filter(Boolean).join(",");
          const url = productIds ? `/api/products/recent-views?ids=${productIds}` : "/api/products/recent-views";
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const apiProducts = Array.isArray(data?.products) ? data.products : [];

            const apiFormatted = apiProducts
              .filter((p: any) => p.id !== currentProductId) // Mevcut ürünü filtrele
              .map((p: any) => ({
                id: `api-${p.id}`,
                productId: p.id,
                name: p.name,
                slug: p.slug,
                price: p.price,
                image: p.primaryImage || p.image || null,
              }));

            const apiProductIds = new Set(apiFormatted.map((p: any) => p.productId));

            type ProductItem = {
              id: string;
              productId: string;
              name: string;
              slug?: string;
              price: number;
              image: string | null;
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
            setViewedProducts(combined.slice(0, 12));
          } else {
            setViewedProducts(localFormatted.slice(0, 12));
          }
        } catch (apiError) {
          console.error("Error fetching API recent views:", apiError);
          setViewedProducts(localFormatted.slice(0, 12));
        }
      } catch (error) {
        console.error("Error loading recently viewed:", error);
        setViewedProducts([]);
      }
    };

    loadRecentlyViewed();

    window.addEventListener("recentlyViewedUpdated", loadRecentlyViewed);

    return () => {
      window.removeEventListener("recentlyViewedUpdated", loadRecentlyViewed);
    };
  }, [currentProductId]); // currentProductId değiştiğinde yeniden yükle

  if (viewedProducts.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 border-t border-gray-200">
      <h2 className="text-2xl md:text-3xl font-serif font-light text-black mb-8">
        Son Görüntülenenler
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {viewedProducts.map((product) => (
          <Link
            key={product.id}
            href={product.slug ? `/products/${product.slug}` : `/product/${product.productId}`}
            className="shrink-0 w-48 group"
          >
            <div className="relative aspect-3/4 mb-4 overflow-hidden bg-gray-100">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={`Dark Velvet ${product.name}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="192px"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Fotoğraf Yok</span>
                </div>
              )}
            </div>
            <h3 className="text-sm font-light text-black mb-1">{product.name}</h3>
            <p className="text-sm font-light text-black">{product.price} ₺</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
 
function ParentLookConfigsSection({ configs }: { configs: any[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 border-t border-gray-100 bg-gray-50/30">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div className="space-y-4">
          <span className="text-[10px] tracking-[0.4em] uppercase font-bold text-black/40">Kombin Parçası</span>
          <h2 className="text-3xl md:text-4xl font-serif font-light text-black">
             Bu Ürünün Bir Parçası Olduğu Stil
          </h2>
          <p className="text-sm text-gray-500 font-light">
            Bu ürün aşağıdaki ana kombinasyonun bir parçasıdır. Tüm kombini inceleyebilirsiniz.
          </p>
        </div>
      </div>
 
      <div className="flex flex-wrap gap-10">
        {configs.filter(c => c.isVisible).map((config, idx) => {
          if (!config.mainProduct) return null;
          const p = config.mainProduct;
          return (
            <Link 
              key={idx} 
              href={`/products/${p.slug}`} 
              className="group flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[40px] shadow-sm hover:shadow-xl transition-all duration-700 ring-1 ring-black/5"
            >
              <div className="relative w-48 h-64 overflow-hidden rounded-[30px]">
                <Image
                  src={p.primaryImage || p.image || "/placeholder.jpg"}
                  alt={`Dark Velvet ${p.name}`}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col gap-4 text-center md:text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{config.title || "Kombin Ana Ürünü"}</span>
                  <h3 className="text-2xl font-serif font-light text-black group-hover:text-black/70 transition-colors">{p.name}</h3>
                </div>
                <div className="flex items-baseline gap-3 justify-center md:justify-start">
                  <span className="text-lg font-medium">{p.price.toLocaleString('tr-TR')} ₺</span>
                  <ArrowRight className="w-5 h-5 text-black/20 group-hover:translate-x-2 transition-transform" />
                </div>
                <Button className="mt-2 bg-black text-white rounded-full px-8 h-12 uppercase text-[10px] tracking-widest">Kombini Gör</Button>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
