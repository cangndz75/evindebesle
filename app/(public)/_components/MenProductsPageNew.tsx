"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Heart, ChevronDown } from "lucide-react";
import ProductFilters from "./ProductFilters";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  colors: (ProductColor & { variant?: ProductVariant })[];
  sizes: ProductSize[];
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

function FavoriteButton({ productId }: { productId: string }) {
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
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-10 disabled:opacity-50"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isFavorite ? "fill-red-500 text-red-500" : "text-[#111]"
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
                <div key={product.id} className="group">
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
                      <FavoriteButton productId={product.id} />
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
