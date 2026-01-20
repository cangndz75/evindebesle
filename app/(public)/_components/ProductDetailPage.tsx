"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Heart, ShoppingBag, Store, Info, Plus, Minus, ChevronLeft } from "lucide-react";
import ProductReviews from "./ProductReviews";

interface ProductDetailPageProps {
  product?: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    images: string[] | { url: string; badge?: string }[];
    colors: { id?: string; name: string; value: string; variant?: string; images?: string[] }[];
    sizes: string[] | { name: string; stock: number }[];
    variants?: { colorId: string; stock: number; variantCode: string }[];
    details: string[];
    fabric?: string;
    care?: string;
    washing?: string;
    delivery?: string;
    sizeNotes?: string;
    reviews?: { id: string; userName: string; rating: number; comment: string; createdAt: Date }[];
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
  const [emailNotify, setEmailNotify] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    fabric: false,
    washing: false,
    delivery: false,
    sizeNotes: false,
  });
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Thumbnail'ler */}
            <div className="flex lg:flex-col gap-2 order-2 lg:order-1">
              {getCurrentColorImages().length > 0 ? getCurrentColorImages().map((img, idx) => {
                const imageUrl = typeof img === 'string' ? img : img.url;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-20 lg:w-20 lg:h-24 overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? "border-black"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${product.name} görsel ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                );
              }) : (
                <div className="w-16 h-20 lg:w-20 lg:h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  Fotoğraf Yok
                </div>
              )}
            </div>

            {/* Ana Görsel */}
            <div className="order-1 lg:order-2 flex-1 min-w-0">
              <div 
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

              {/* Mobile: Badge, Product Name, Color Options below image */}
              <div className="md:hidden mt-4 px-4">
                {/* Badge */}
                {(() => {
                  const currentImage = product.images[selectedImage];
                  const imageBadge = typeof currentImage === 'string' ? undefined : currentImage.badge;
                  return imageBadge ? (
                    <div className="mb-2">
                      <span className="text-xs text-gray-600 font-light uppercase tracking-wide">
                        {imageBadge}
                      </span>
                    </div>
                  ) : null;
                })()}
                
                {/* Product Name */}
                <h1 className="text-xl font-serif font-light text-black mb-4">
                  {product.name}
                </h1>

                {/* Color Options */}
                <div>
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
              </div>
            </div>
          </div>

          {/* Sağ: Ürün Bilgileri */}
          <div className="flex flex-col justify-start pt-8 lg:pt-0">
            {/* Başlık - Hidden on mobile, shown on desktop */}
            <h1 className="hidden md:block text-3xl md:text-4xl font-serif font-light text-black mb-4">
              {product.name}
            </h1>

            {/* Fiyat */}
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-light text-black">
                {product.price} ₺
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through ml-3">
                  {product.originalPrice} ₺
                </span>
              )}
            </div>

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
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-light text-black">Beden</p>
                <button className="text-xs text-gray-500 hover:text-black underline font-light">
                  Beden Rehberi
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {(() => {
                  const availableSizes = getAvailableSizesForColor();
                  if (availableSizes.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 col-span-4">Bu renk için beden seçeneği bulunmuyor.</p>
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
                        className={`py-2.5 px-3 text-sm font-light border transition-all ${
                          isSelected
                            ? "border-black bg-gray-50"
                            : isOutOfStock
                            ? "border-gray-200 text-gray-400 line-through cursor-not-allowed"
                            : "border-gray-300 hover:border-gray-500"
                        }`}
                      >
                        {sizeName}
                      </button>
                    );
                  });
                })()}
              </div>
              {selectedSize && getVariantStock(selectedSize) <= 0 && (
                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded">
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
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Info className="w-4 h-4" />
                <span className="font-light">{product.sizeNotes || "True to size - Kalıbına uygun"}</span>
              </div>
            </div>

            {/* Butonlar */}
            <div className="space-y-3 mb-12">
              <button className="w-full py-4 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-colors text-sm md:text-base">
                Sepete Ekle
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={toggleFavorite}
                  disabled={isLoadingFavorite}
                  className={`flex items-center justify-center gap-2 py-3 border border-black font-light hover:bg-black hover:text-white transition-all text-sm ${
                    isFavorite ? "bg-black text-white" : "text-black"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-white text-white" : ""}`} />
                  {isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                </button>
                <button className="flex items-center justify-center gap-2 py-3 border border-black text-black font-light hover:bg-black hover:text-white transition-all text-sm">
                  <Store className="w-4 h-4" />
                  Mağazada Bul
                </button>
              </div>
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
      <ProductReviews productId={product.id} reviews={product.reviews || []} />

      {/* Takımı Tamamla Bölümü */}
      <CompleteTheSetSection />

      {/* Son Görüntülenenler */}
      <RecentlyViewedSection />

      {/* Footer */}
      <FooterSection />
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
