"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Heart, ChevronDown, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import ProductFilters from "./ProductFilters";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type ProductColor = {
  name: string;
  hexCode?: string;
  images: string[];
};

type ProductSize = {
  name: string;
  stock: number;
};

type ProductTag = {
  name: string;
};

type ProductVariant = {
  id: string;
  variantCode: string;
  colorId: string;
};

type Product = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image?: string;
  primaryImage?: string;
  secondaryImage?: string;
  gender?: "MALE" | "FEMALE" | "UNISEX";
  fabricType?: string;
  colors: (ProductColor & { variant?: ProductVariant; id?: string; variants?: any[] })[];
  sizes: ProductSize[];
  sizeOptions?: Array<{ name: string; isActive: boolean }>;
  tags: ProductTag[];
};

type FilterState = {
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  fabricTypes: string[];
};

type ActiveFilter = {
  type: "price" | "size" | "color" | "fabric";
  label: string;
  value: string;
};

const categories = [
  "All",
  "Underwear",
  "T-Shirts",
  "Tanks",
  "Shorts",
  "Sets",
  "Active",
];

function FavoriteButton({ productId, productName }: { productId: string; productName: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Favori durumunu kontrol et
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const res = await fetch(`/api/favorites/check?productId=${productId}`);
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };
    checkFavorite();
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?productId=${productId}`, {
          method: "DELETE",
        });
        setIsFavorite(false);
        toast.success(`${productName} favorilerden çıkarıldı`, {
          position: "bottom-left",
        });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setIsFavorite(true);
        toast.success(`${productName} favorilere eklendi`, {
          position: "bottom-left",
        });
      }
      // Header'daki favori sayısını güncellemek için event dispatch et
      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-10 disabled:opacity-50 shadow-sm"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isFavorite ? "fill-[#111] text-[#111]" : "text-[#111]"
        }`}
      />
    </button>
  );
}

export default function MenProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    sizes: [],
    colors: [],
    fabricTypes: [],
  });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [hoveredColor, setHoveredColor] = useState<{
    productId: string;
    colorImage: string;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{
    productId: string;
    colorImage: string;
    variantCode?: string;
  } | null>(null);

  // Fiyat aralığını veritabanından çek
  useEffect(() => {
    const fetchPriceRange = async () => {
      try {
        const res = await fetch("/api/products/price-range");
        const data = await res.json();
        if (data.min !== undefined && data.max !== undefined) {
          setPriceRange({ min: data.min, max: data.max });
        }
      } catch (error) {
        console.error("Fiyat aralığı yüklenirken hata:", error);
      }
    };
    fetchPriceRange();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("gender", "MALE");
        
        // Tag filter - erkek tag'i varsa
        if (selectedCategory !== "All") {
          params.append("tag", selectedCategory.toLowerCase());
        }

        // Price filters
        if (filters.minPrice) {
          params.append("minPrice", filters.minPrice.toString());
        }
        if (filters.maxPrice) {
          params.append("maxPrice", filters.maxPrice.toString());
        }

        // Size filters
        filters.sizes.forEach((size) => {
          params.append("size", size);
        });

        // Color filters
        filters.colors.forEach((color) => {
          params.append("color", color);
        });

        // Fabric type filters
        if (filters.fabricTypes.length > 0) {
          params.append("fabricType", filters.fabricTypes[0]);
        }

        const response = await fetch(`/api/products?${params.toString()}`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Ürünler yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, filters]);

  // Extract available options from products
  const availableOptions = useMemo(() => {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    const fabricTypes = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    products.forEach((product) => {
      product.sizes.forEach((s) => sizes.add(s.name));
      product.colors.forEach((c) => colors.add(c.name));
      if (product.fabricType) {
        fabricTypes.add(product.fabricType);
      }
      if (product.price < minPrice) minPrice = product.price;
      if (product.price > maxPrice) maxPrice = product.price;
    });

    return {
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors).sort(),
      fabricTypes: Array.from(fabricTypes).sort(),
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: maxPrice === 0 ? 2000 : Math.ceil(maxPrice),
      },
    };
  }, [products]);

  // Active filters for display
  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const result: ActiveFilter[] = [];

    if (filters.minPrice || filters.maxPrice) {
      const label =
        filters.minPrice && filters.maxPrice
          ? `₺${filters.minPrice} - ₺${filters.maxPrice}`
          : filters.minPrice
          ? `₺${filters.minPrice}+`
          : `₺${filters.maxPrice}-`;
      result.push({
        type: "price",
        label,
        value: `${filters.minPrice || ""}-${filters.maxPrice || ""}`,
      });
    }

    filters.sizes.forEach((size) => {
      result.push({ type: "size", label: size, value: size });
    });

    filters.colors.forEach((color) => {
      result.push({ type: "color", label: color, value: color });
    });

    filters.fabricTypes.forEach((fabric) => {
      result.push({ type: "fabric", label: fabric, value: fabric });
    });

    return result;
  }, [filters]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (filter: ActiveFilter) => {
    const newFilters = { ...filters };

    switch (filter.type) {
      case "price":
        newFilters.minPrice = undefined;
        newFilters.maxPrice = undefined;
        break;
      case "size":
        newFilters.sizes = newFilters.sizes.filter((s) => s !== filter.value);
        break;
      case "color":
        newFilters.colors = newFilters.colors.filter((c) => c !== filter.value);
        break;
      case "fabric":
        newFilters.fabricTypes = newFilters.fabricTypes.filter(
          (f) => f !== filter.value
        );
        break;
    }

    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      sizes: [],
      colors: [],
      fabricTypes: [],
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const handleColorClick = (productId: string, color: ProductColor, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const colorImage = color.images[0] || "";
    const variantCode = color.variant?.variantCode;
    setSelectedColor({ productId, colorImage, variantCode });
  };

  const handleColorHover = (productId: string, colorImage: string) => {
    setHoveredColor({ productId, colorImage });
  };

  const handleColorLeave = () => {
    setHoveredColor(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <Link
            href="/"
            className="text-sm text-[#111]/60 font-light hover:text-[#111]"
          >
            Ana Sayfa
          </Link>
          <span className="text-sm text-[#111]/60 font-light mx-2">/</span>
          <span className="text-sm text-[#111] font-light">Erkek</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111] mb-6">
          Erkek
        </h1>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-light uppercase tracking-wide transition-colors ${
                selectedCategory === category
                  ? "bg-[#111] text-white"
                  : "bg-white text-[#111] border border-[#111] hover:bg-[#111] hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filter and Sort */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <ProductFilters
            availableSizes={availableOptions.sizes}
            availableColors={availableOptions.colors}
            availableFabricTypes={availableOptions.fabricTypes}
            priceRange={priceRange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            activeFilters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
          />

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#111]/60 font-light">
              {products.length} ürün
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#111] font-light">Sırala:</span>
              <select className="text-sm font-light text-[#111] bg-transparent border-none focus:outline-none cursor-pointer">
                <option>Öne Çıkanlar</option>
                <option>Fiyat: Düşükten Yükseğe</option>
                <option>Fiyat: Yüksekten Düşüğe</option>
                <option>En Yeni</option>
              </select>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-[#111]/60">
            Ürün bulunamadı
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => {
              // İlk açılışta ana renk (ilk renk) göster
              const defaultColor = product.colors[0];
              
              // Seçili renk varsa onu kullan, yoksa ana renk
              const selectedColorForProduct = selectedColor?.productId === product.id
                ? product.colors.find(c => c.images[0] === selectedColor.colorImage)
                : null;
              
              // Aktif renk: seçili renk veya ana renk
              const activeColorObj = selectedColorForProduct || defaultColor;
              
              // Hover durumunda hover'daki renk, yoksa aktif renk
              const hoveredColorObj = hoveredColor?.productId === product.id
                ? product.colors.find(c => c.images[0] === hoveredColor.colorImage)
                : null;
              
              // Görüntülenecek renk: hover varsa hover, yoksa aktif renk
              const displayColorObj = hoveredColorObj || activeColorObj;
              
              // Ana görsel: aktif renge göre
              const currentImage =
                displayColorObj?.images[0] ||
                product.primaryImage ||
                product.image ||
                "/placeholder.jpg";
              
              // Hover görseli: aktif renge göre (sadece 2+ resim varsa)
              const hasMultipleImages = displayColorObj?.images.length && displayColorObj.images.length > 1;
              const hoverImage = hasMultipleImages
                ? displayColorObj.images[1]
                : product.secondaryImage ||
                  (defaultColor?.images.length > 1 ? defaultColor.images[1] : null) ||
                  product.primaryImage ||
                  currentImage;

              // URL oluştur - slug varsa slug kullan, yoksa id
              const productUrl = product.slug 
                ? `/products/${product.slug}`
                : `/product/${product.id}`;
              
              // Seçili renge göre variant ekle
              const variant = selectedColor?.productId === product.id 
                ? selectedColor.variantCode 
                : product.colors[0]?.variant?.variantCode;
              const finalUrl = variant ? `${productUrl}?variant=${variant}` : productUrl;

              return (
                <div key={product.id} className="group relative overflow-hidden">
                  <Link href={finalUrl} className="block">
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                      <Image
                        src={currentImage}
                        alt={product.name}
                        fill
                        className={`object-cover transition-opacity duration-500 ${
                          hasMultipleImages && hoverImage !== currentImage
                            ? "group-hover:opacity-0"
                            : ""
                        }`}
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                      {hasMultipleImages && hoverImage && hoverImage !== currentImage && (
                        <Image
                          src={hoverImage}
                          alt={`${product.name} hover`}
                          fill
                          className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized
                        />
                      )}
                      <FavoriteButton productId={product.id} productName={product.name} />
                      
                    </div>
                  </Link>

                  <div className="mb-2">
                    <h3 className="text-sm md:text-base font-light text-[#111] mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm md:text-base font-light text-[#111]">
                        {product.price.toFixed(2)} ₺
                      </span>
                    </div>
                    {product.colors.length > 0 && (
                      <p className="text-xs text-[#111]/60 font-light mt-1">
                        {product.colors.length} renk seçeneği
                      </p>
                    )}
                  </div>

                  {/* Hover'da Hızlı Ekle Bölümü - Altından animasyonlu çıkar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out border-t border-gray-200 shadow-lg z-20 overflow-hidden">
                    <div className="p-4">
                      <p className="text-xs font-light text-[#111] mb-3 text-center">Hızlı ekle</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {(() => {
                          // Önce sizes'ı kontrol et, yoksa sizeOptions'ı kullan
                          const availableSizes = product.sizes && product.sizes.length > 0
                            ? product.sizes
                            : product.sizeOptions && product.sizeOptions.length > 0
                            ? product.sizeOptions.map(so => ({ name: so.name, stock: 0, id: undefined }))
                            : [];
                          
                          if (availableSizes.length === 0) {
                            return (
                              <p className="text-xs text-gray-500">Beden seçeneği bulunmuyor</p>
                            );
                          }

                          // Seçili renge göre variant stok kontrolü
                          const currentColorId = displayColorObj?.id || product.colors[0]?.id;
                          
                          return availableSizes.map((size, sizeIdx) => {
                            const sizeName = typeof size === 'string' ? size : size.name;
                            const sizeStock = typeof size === 'object' ? size.stock : 0;
                            const sizeId = typeof size === 'object' && (size as any).id 
                              ? (size as any).id 
                              : null;
                            
                            // Variant stok kontrolü (seçili renge göre)
                            let variantStock = 0;
                            if (currentColorId && displayColorObj?.variants) {
                              const variant = displayColorObj.variants.find((v: any) => 
                                v.colorId === currentColorId && v.sizeId === sizeId
                              );
                              variantStock = variant?.stock || 0;
                            }
                            
                            const finalStock = variantStock > 0 ? variantStock : sizeStock;
                            const isOutOfStock = finalStock <= 0;
                            
                            return (
                              <button
                                key={sizeIdx}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  if (isOutOfStock) {
                                    toast.error("Bu beden stokta yok", {
                                      position: "bottom-left",
                                    });
                                    return;
                                  }

                                  try {
                                    const res = await fetch("/api/cart", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        productId: product.id,
                                        colorId: currentColorId || null,
                                        sizeId: sizeId || null,
                                        quantity: 1,
                                      }),
                                    });

                                    if (res.ok) {
                                      window.dispatchEvent(new Event("cartUpdated"));
                                      toast.success(`${product.name} (${sizeName}) sepete eklendi`, {
                                        position: "bottom-left",
                                      });
                                    } else {
                                      const error = await res.json();
                                      toast.error(error.error || "Sepete eklenirken bir hata oluştu", {
                                        position: "bottom-left",
                                      });
                                    }
                                  } catch (error) {
                                    console.error("Error adding to cart:", error);
                                    toast.error("Sepete eklenirken bir hata oluştu", {
                                      position: "bottom-left",
                                    });
                                  }
                                }}
                                disabled={isOutOfStock}
                                className={`px-3 py-1.5 text-xs font-light border transition-all ${
                                  isOutOfStock
                                    ? "border-gray-200 text-gray-400 line-through cursor-not-allowed bg-white"
                                    : "border-gray-300 hover:border-[#111] hover:bg-[#111] hover:text-white bg-white text-[#111]"
                                }`}
                              >
                                {sizeName}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {product.colors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {product.colors.map((color, idx) => {
                        const isSelected = selectedColor?.productId === product.id &&
                          product.colors.find(c => c.images[0] === selectedColor.colorImage)?.name === color.name;
                        const isHovered = hoveredColor?.productId === product.id &&
                          product.colors.find(c => c.images[0] === hoveredColor.colorImage)?.name === color.name;
                        return (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <button
                                onMouseEnter={() =>
                                  handleColorHover(product.id, color.images[0] || currentImage)
                                }
                                onMouseLeave={handleColorLeave}
                                onClick={(e) => handleColorClick(product.id, color, e)}
                                className={`w-4 h-4 rounded-full border transition-all duration-200 hover:scale-110 ${
                                  isSelected
                                    ? "border-[#111] scale-110"
                                    : "border-gray-300"
                                }`}
                                style={{
                                  backgroundColor:
                                    color.hexCode || "#ccc",
                                }}
                                aria-label={`${color.name} renk seçeneği`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="capitalize">{color.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
