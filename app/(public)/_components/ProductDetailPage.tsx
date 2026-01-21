"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Heart, ShoppingBag, Info, Plus, Minus, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import ProductReviews from "./ProductReviews";
import SizeGuideModal from "./SizeGuideModal";

interface ProductDetailPageProps {
  product?: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    images: string[] | { url: string; badge?: string }[];
    colors: { id?: string; name: string; value: string; variant?: string; images?: string[] }[];
    sizes: string[] | { id?: string; name: string; stock: number }[];
    sizeOptions?: { id?: string; name: string; stock?: number }[];
    variants?: { colorId: string; stock: number; variantCode: string }[];
    details: string[];
    fabric?: string;
    care?: string;
    washing?: string;
    delivery?: string;
    sizeNotes?: string;
    reviews?: { id: string; userName: string; rating: number; comment: string; createdAt: Date; colorId?: string; colorName?: string }[];
  };
}

const defaultProduct = {
  id: "1",
  name: "Dantel Balkonet Sütyen",
  price: 899,
  originalPrice: undefined,
  description: "İtalyan dantelinden üretilen balkonet sütyen, zarif tasarımı ve mükemmel desteğiyle öne çıkıyor. Çıkarılabilir askıları sayesinde farklı kıyafetlerle kombinlenebilir.",
  images: [
    { url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop", badge: "Yeni Sezon" },
    { url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop", badge: undefined },
    { url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop", badge: "İndirim" },
    { url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop", badge: undefined },
  ],
  colors: [
    { name: "Siyah", value: "#000000" },
    { name: "Beyaz", value: "#ffffff" },
    { name: "Bej", value: "#e8d5c4" },
  ],
  sizes: ["70B", "70C", "75B", "75C", "80B", "80C", "85B", "85C"],
  details: [
    "İtalyan dantel detayları",
    "Çıkarılabilir askılar",
    "Ayarlanabilir arka klips",
    "Balenli destek",
    "Balkonet kesim",
  ],
  fabric: "Polyester %85, Elastan %15",
  care: "Yumuşak deterjanla yıkayın, düşük ısıda ütüleyin",
  washing: "30°C'de yıkayın, kurutma makinesinde kurutmayın",
  delivery: "2-3 iş günü içinde teslimat",
  sizeNotes: "True to size - Kalıbına uygun",
};

export default function ProductDetailPage({ product = defaultProduct }: ProductDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [emailNotify, setEmailNotify] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    fabric: false,
    washing: false,
    delivery: false,
    sizeNotes: false,
  });
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [thumbnailScrollIndex, setThumbnailScrollIndex] = useState(0);

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

  // Seçili renge göre fotoğrafları al
  const getCurrentColorImages = () => {
    const currentColor = product.colors[selectedColor];
    if (currentColor?.images && currentColor.images.length > 0) {
      // images array'ini parse et (eğer string ise)
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
    // Fallback: product.images (başlangıçta gelen images)
    if (product.images && product.images.length > 0) {
      // product.images zaten formatlanmış olabilir
      const formattedImages = product.images.map((img) => {
        if (typeof img === 'string') {
          return { url: img, badge: undefined };
        }
        return img;
      });
      return formattedImages;
    }
    // Eğer hiç image yoksa, primaryImage veya image kullan
    const fallbackImage = (product as any).primaryImage || (product as any).image;
    if (fallbackImage) {
      return [{ url: fallbackImage, badge: undefined }];
    }
    return [];
  };

  // Renk değiştiğinde fotoğrafları güncelle
  const handleColorChange = (idx: number) => {
    setSelectedColor(idx);
    setSelectedImage(0); // İlk fotoğrafa dön
    setSelectedSize(""); // Beden seçimini sıfırla (yeni renk için)
    setQuantity(1); // Adeti 1'e sıfırla
    setThumbnailScrollIndex(0); // Thumbnail scroll'u sıfırla
  };

  // Beden stok kontrolü
  const getSizeStock = (sizeName: string): number => {
    if (!product.sizes || product.sizes.length === 0) return 0;
    if (typeof product.sizes[0] === 'string') return 0;
    const sizeObj = product.sizes.find((s: any) => 
      typeof s === 'object' && s.name === sizeName
    ) as { name: string; stock: number } | undefined;
    return sizeObj?.stock || 0;
  };

  // Seçili renge göre variant stok kontrolü
  const getVariantStock = (sizeName: string): number => {
    const currentColor = product.colors[selectedColor];
    if (!currentColor?.id) {
      // Renk yoksa ProductSize'dan stok kontrolü yap
      return getSizeStock(sizeName);
    }
    
    // Seçili renge ait variant'ı bul
    const variant = product.variants?.find((v) => 
      v.colorId === currentColor.id
    );
    
    // Eğer variant varsa ve stoku varsa, o renk için tüm bedenler aktif
    if (variant && variant.stock > 0) {
      // Variant stoku varsa, ProductSize'dan da kontrol et
      const sizeStock = getSizeStock(sizeName);
      // Eğer ProductSize'da stok varsa onu kullan, yoksa variant stokunu kullan
      return sizeStock > 0 ? sizeStock : variant.stock;
    }
    
    // Variant yoksa veya stoku yoksa, ProductSize'dan stok kontrolü yap
    return getSizeStock(sizeName);
  };
  
  // Seçili renge göre tüm bedenleri getir (stok kontrolü ayrı yapılacak)
  const getAvailableSizesForColor = () => {
    if (!product.sizes || product.sizes.length === 0) {
      // Eğer sizes yoksa sizeOptions'ı kullan
      if (product.sizes && typeof product.sizes[0] === 'string') {
        return product.sizes;
      }
      return [];
    }
    
    // Tüm bedenleri göster (stok kontrolü getVariantStock'ta yapılacak)
    return product.sizes;
  };

  // Stok yoksa mail bildirimi
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

  // Favori durumunu kontrol et
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

  // Ürün görüntüleme kaydı ekle
  useEffect(() => {
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

  // Favorilere ekle/çıkar
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
      // Header'daki favori sayısını güncellemek için event dispatch et
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
    <div className="w-full bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500 font-light">
          <Link href="/home" className="hover:text-black transition-colors">
            Ana Sayfa
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/services" className="hover:text-black transition-colors">
            Hizmetler
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-black">{product.name}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Sol: Görseller */}
          <div className="flex flex-col lg:flex-row gap-4 lg:max-w-[600px]">
            {/* Thumbnail'ler - Scrollable */}
            <div className="flex lg:flex-col gap-2 order-2 lg:order-1 relative">
              {getCurrentColorImages().length > 0 ? (
                <>
                  {/* Scroll Up Button - Sadece 4'ten fazla thumbnail varsa */}
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
                          className={`relative w-16 h-20 lg:w-20 lg:h-24 flex-shrink-0 overflow-hidden border-2 transition-all ${
                            selectedImage === actualIdx
                              ? "border-black"
                              : "border-transparent hover:border-gray-300"
                          }`}
                        >
                          <Image
                            src={imageUrl}
                            alt={`${product.name} görsel ${actualIdx + 1}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Scroll Down Button - Sadece 4'ten fazla thumbnail varsa */}
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

            {/* Ana Görsel */}
            <div className="order-1 lg:order-2 flex-1 min-w-0 relative">
              <div 
                ref={imageContainerRef}
                className="relative w-full aspect-[3/4] group overflow-hidden"
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
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                      
                      {/* Badge */}
                      {imageBadge && (
                        <div className="absolute top-3 left-3 bg-white text-black text-[10px] px-2 py-1 uppercase font-light">
                          {imageBadge}
                        </div>
                      )}
                      {/* Heart Icon - Mobile only */}
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
                {/* Mobile Navigation Buttons */}
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

          {/* Sağ: Ürün Bilgileri */}
          <div className="flex flex-col justify-start pt-8 lg:pt-0">
            {/* Başlık - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-serif font-light text-black">
                {product.name}
              </h1>
              <button
                onClick={toggleFavorite}
                disabled={isLoadingFavorite}
                className="ml-4 hover:opacity-70 transition-opacity"
                aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? "fill-red-500 text-red-500" : "text-black"}`} />
              </button>
            </div>

            {/* Fiyat */}
            <div className="mb-4">
              <span className="text-2xl md:text-3xl font-light text-black">
                {product.price} ₺
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through ml-3">
                  {product.originalPrice} ₺
                </span>
              )}
            </div>

            {/* Rating ve Yorum Sayısı */}
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

            {/* Açıklama */}
            <p className="text-base text-gray-700 font-light leading-relaxed mb-8 max-w-lg">
              {product.description}
            </p>

            {/* Renk Seçimi - Hidden on mobile, shown on desktop */}
            <div className="hidden md:block mb-8">
              <p className="text-sm font-light text-black mb-3">
                Renk: <span className="font-normal">{product.colors[selectedColor].name}</span>
              </p>
              <div className="flex gap-3">
                {product.colors.map((color, idx) => {
                  // Renk için ilk fotoğrafı al
                  const colorImage = color.images && color.images.length > 0 
                    ? (typeof color.images === 'string' 
                        ? (() => {
                            try {
                              const parsed = JSON.parse(color.images);
                              return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
                            } catch {
                              return color.images;
                            }
                          })()
                        : color.images[0])
                    : null;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleColorChange(idx)}
                      className={`relative w-16 h-20 overflow-hidden border-2 transition-all ${
                        selectedColor === idx
                          ? "border-black scale-105"
                          : "border-gray-300 hover:border-gray-500"
                      }`}
                      aria-label={color.name}
                    >
                      {colorImage ? (
                        <Image
                          src={colorImage}
                          alt={color.name}
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
                  );
                })}
              </div>
            </div>

            {/* Beden Seçimi */}
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
                          className={`px-4 py-2 text-sm font-light border transition-all ${
                            isSelected
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
              
              {/* Model Bilgisi ve Linkler */}
              <div className="mb-6">
                <p className="text-xs text-gray-600 font-light mb-2">
                  Model 6'1 boyunda ve M beden giyiyor.
                </p>
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

              {selectedSize && getVariantStock(selectedSize) <= 0 && (
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
                      Bildir
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Adet ve Sepete Ekle */}
            <div className="flex items-center gap-4 mb-8">
              {/* Adet Seçici */}
              <div className="flex items-center border border-gray-300 h-[56px]">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-4 h-full text-black hover:bg-gray-100 transition-colors font-light flex items-center justify-center disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 h-full text-sm font-light text-black border-x border-gray-300 min-w-[60px] text-center flex items-center justify-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="px-4 h-full text-black hover:bg-gray-100 transition-colors font-light flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Sepete Ekle Butonu */}
              <button
                onClick={async () => {
                  if (!selectedSize) {
                    toast.error("Lütfen bir beden seçin");
                    return;
                  }

                  try {
                    // Seçili renk ve beden ID'lerini bul
                    const selectedColorObj = product.colors?.[selectedColor];
                    const selectedSizeObj = product.sizes?.find(
                      (s: any) => typeof s === 'object' && s.name === selectedSize
                    ) || product.sizeOptions?.find(
                      (s: any) => typeof s === 'object' && s.name === selectedSize
                    );

                    const colorId = selectedColorObj?.id || null;
                    const sizeId = (selectedSizeObj && typeof selectedSizeObj === 'object' && 'id' in selectedSizeObj) 
                      ? selectedSizeObj.id 
                      : null;

                    const res = await fetch("/api/cart", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        productId: product.id,
                        colorId,
                        sizeId,
                        quantity,
                      }),
                    });

                    if (res.ok) {
                      // Sepet sayısını güncellemek için event dispatch et
                      window.dispatchEvent(new Event("cartUpdated"));
                      // Toast notification göster ve sepeti aç
                      toast.success(`${quantity} adet ${product.name} (${selectedSize}) sepete eklendi`, {
                        action: {
                          label: "Sepeti Görüntüle",
                          onClick: () => {
                            window.dispatchEvent(new Event("openCart"));
                          },
                        },
                      });
                    } else {
                      const error = await res.json();
                      toast.error(error.error || "Sepete eklenirken bir hata oluştu");
                    }
                  } catch (error) {
                    console.error("Error adding to cart:", error);
                    toast.error("Sepete eklenirken bir hata oluştu");
                  }
                }}
                disabled={!selectedSize || getVariantStock(selectedSize) <= 0}
                className="flex-1 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold h-[56px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sepete Ekle
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Accordion Detaylar */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 border-t border-gray-200">
        <div className="space-y-0">
          {/* Ürün Detayı */}
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
              </div>
            )}
          </div>

          {/* Kumaş ve Bakım */}
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

          {/* Yıkama Talimatları */}
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
                <p className="text-sm text-gray-700 font-light">{product.washing}</p>
              </div>
            )}
          </div>

          {/* Teslimat ve İade */}
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
                <p className="text-sm text-gray-700 font-light">{product.delivery}</p>
              </div>
            )}
          </div>

          {/* Beden Notları */}
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
                <p className="text-sm text-gray-700 font-light">{product.sizeNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yorumlar Bölümü */}
      <ProductReviews 
        productId={product.id} 
        selectedColorId={product.colors[selectedColor]?.id}
        reviews={product.reviews || []} 
      />

      {/* Takımı Tamamla Bölümü */}
      <CompleteTheSetSection />

      {/* Son Görüntülenenler */}
      <RecentlyViewedSection />

      {/* Footer */}
      <FooterSection />

      {/* Beden Rehberi Modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onOpenChange={setSizeGuideOpen}
        sizeGuide={{
          productName: product.name,
          measurements: [], // Veritabanından gelecek
        }}
      />
    </div>
  );
}

// Takımı Tamamla Bölümü
function CompleteTheSetSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const setProducts = [
    {
      id: "1",
      name: "Dantel Külot",
      price: 449,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: "2",
      name: "Dantel Tanga",
      price: 399,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: "3",
      name: "Dantel Body",
      price: 899,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: "4",
      name: "Dantel Gecelik",
      price: 1299,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    },
  ];

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
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <h2 className="text-2xl md:text-3xl font-serif font-light text-black text-center mb-12">
        Takımı Tamamla
      </h2>
      <div className="relative">
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
          style={{ scrollBehavior: "smooth" }}
        >
          {setProducts.map((item) => (
            <Link key={item.id} href={`/product/${item.id}`} className="flex-shrink-0 w-64 md:w-72 snap-start group">
              <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 256px, 288px"
                />
              </div>
              <h3 className="text-sm font-light text-black mb-1">{item.name}</h3>
              <p className="text-sm font-light text-black">{item.price} ₺</p>
            </Link>
          ))}
        </div>
        {/* Navigation Buttons */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 bg-white border border-gray-300 p-2 md:p-3 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 shadow-lg z-10"
          aria-label="Önceki"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 bg-white border border-gray-300 p-2 md:p-3 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 shadow-lg z-10"
          aria-label="Sonraki"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </section>
  );
}

// Footer Section
function FooterSection() {
  return (
    <>
      {/* Marquee Strip */}
      <div className="w-full overflow-hidden border-t border-b border-black/10 bg-white py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          <span className="text-xs md:text-sm font-light text-[#111] tracking-wider uppercase mr-8">
            ÜCRETSİZ KARGO 999₺+ • 30 GÜN KOLAY İADE • PREMIUM KUMAŞ • HIZLI TESLİMAT
          </span>
          <span className="text-xs md:text-sm font-light text-[#111] tracking-wider uppercase mr-8">
            ÜCRETSİZ KARGO 999₺+ • 30 GÜN KOLAY İADE • PREMIUM KUMAŞ • HIZLI TESLİMAT
          </span>
        </div>
      </div>

      {/* Footer Accordion */}
      <div className="w-full bg-white border-t border-black/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div>
              <h3 className="text-sm font-light uppercase tracking-wider text-[#111] mb-4">Müşteri Hizmetleri</h3>
              <ul className="space-y-2 text-sm font-light text-[#111]/70">
                <li><Link href="/contact" className="hover:text-[#111] transition-colors">İletişim</Link></li>
                <li><Link href="/shipping" className="hover:text-[#111] transition-colors">Kargo & Teslimat</Link></li>
                <li><Link href="/returns" className="hover:text-[#111] transition-colors">İade & Değişim</Link></li>
                <li><Link href="/faq" className="hover:text-[#111] transition-colors">Sık Sorulan Sorular</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-light uppercase tracking-wider text-[#111] mb-4">Hesabım</h3>
              <ul className="space-y-2 text-sm font-light text-[#111]/70">
                <li><Link href="/profile" className="hover:text-[#111] transition-colors">Profil</Link></li>
                <li><Link href="/orders" className="hover:text-[#111] transition-colors">Siparişlerim</Link></li>
                <li><Link href="/favorites" className="hover:text-[#111] transition-colors">Favorilerim</Link></li>
                <li><Link href="/addresses" className="hover:text-[#111] transition-colors">Adreslerim</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-light uppercase tracking-wider text-[#111] mb-4">Şirket</h3>
              <ul className="space-y-2 text-sm font-light text-[#111]/70">
                <li><Link href="/about" className="hover:text-[#111] transition-colors">Hakkımızda</Link></li>
                <li><Link href="/stores" className="hover:text-[#111] transition-colors">Mağazalarımız</Link></li>
                <li><Link href="/careers" className="hover:text-[#111] transition-colors">Kariyer</Link></li>
                <li><Link href="/blog" className="hover:text-[#111] transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-light uppercase tracking-wider text-[#111] mb-4">Yasal</h3>
              <ul className="space-y-2 text-sm font-light text-[#111]/70">
                <li><Link href="/privacy" className="hover:text-[#111] transition-colors">Gizlilik Politikası</Link></li>
                <li><Link href="/terms" className="hover:text-[#111] transition-colors">Kullanım Koşulları</Link></li>
                <li><Link href="/kvkk" className="hover:text-[#111] transition-colors">KVKK</Link></li>
                <li><Link href="/distance-selling" className="hover:text-[#111] transition-colors">Mesafeli Satış</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-black/10 text-center">
            <p className="text-xs font-light text-[#111]/60">
              © 2024 Dark Velvet. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Son Görüntülenenler Bölümü
function RecentlyViewedSection() {
  const viewedProducts = [
    { id: "1", name: "Seamless Külot", price: 349, image: null },
    { id: "2", name: "Saten Takım", price: 1299, image: null },
    { id: "3", name: "Wireless Sütyen", price: 749, image: null },
    { id: "4", name: "Dantel Body", price: 1099, image: null },
    { id: "5", name: "High-Waist Külot", price: 449, image: null },
    {
      id: "6",
      name: "Bridal Takım",
      price: 1899,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 border-t border-gray-200">
      <h2 className="text-2xl md:text-3xl font-serif font-light text-black mb-8">
        Son Görüntülenenler
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {viewedProducts.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-48 group cursor-pointer">
            <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="192px"
                />
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
            <h3 className="text-sm font-light text-black mb-1">{product.name}</h3>
            <p className="text-sm font-light text-black">{product.price} ₺</p>
          </div>
        ))}
      </div>
    </section>
  );
}
