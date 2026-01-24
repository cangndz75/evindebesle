"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Search, Filter, ChevronDown, Heart, ChevronRight, Plus, Minus, Loader2 } from "lucide-react";

type Product = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  badge?: string;
  category?: string;
  tags?: string[];
  slug?: string;
};

type Collection = {
  id: string;
  title: string;
  href: string;
  image: string;
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

// Sample collections - TODO: Veritabanından çekilecek
const collections: Collection[] = [
  {
    id: "1",
    title: "Erkek Paketler",
    href: "/men/bundles",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Kadın Paketler",
    href: "/women/bundles",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Son Fırsat",
    href: "/last-call",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
  },
];

export default function SearchModal({ isOpen, onClose, initialQuery = "" }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({
    category: true,
    size: false,
    color: false,
    price: false,
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  
  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  // Debounced search function
  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setProducts([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        sortBy,
        limit: "50",
      });

      if (selectedCategory) {
        params.append("category", selectedCategory);
      }
      if (priceRange[0] > 0) {
        params.append("minPrice", priceRange[0].toString());
      }
      if (priceRange[1] < 5000) {
        params.append("maxPrice", priceRange[1].toString());
      }
      selectedSizes.forEach(size => params.append("size", size));
      selectedColors.forEach(color => params.append("color", color));

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      if (data.products) {
        setProducts(data.products);
        
        // Suggestions oluştur - ürün adlarından ve etiketlerden
        const uniqueSuggestions = new Set<string>();
        data.products.forEach((product: Product) => {
          if (product.title.toLowerCase().includes(query.toLowerCase())) {
            uniqueSuggestions.add(product.title);
          }
          product.tags?.forEach((tag) => {
            if (tag.toLowerCase().includes(query.toLowerCase())) {
              uniqueSuggestions.add(tag);
            }
          });
        });
        setSuggestions(Array.from(uniqueSuggestions).slice(0, 5));
      } else {
        setProducts([]);
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setProducts([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, selectedCategory, priceRange, selectedSizes, selectedColors]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  useEffect(() => {
    if (isOpen) {
      // Body scroll'unu engelle
      document.body.style.overflow = "hidden";
      // Scroll pozisyonunu kaydet
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      // Scroll pozisyonunu geri yükle
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
    return () => {
      // Cleanup
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Filter products based on local filters (category, price, size, color already applied in API)
  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  // Filter collections
  const filteredCollections = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    const query = searchQuery.toLowerCase();
    return collections.filter((collection) =>
      collection.title.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Detect category from search query
  const detectedCategory = useMemo(() => {
    if (!searchQuery) return null;
    const query = searchQuery.toLowerCase();
    if (query.includes("erkek") || query.includes("men") || query.includes("kadın") || query.includes("women")) {
      if (query.includes("erkek") || query.includes("men")) return "men";
      if (query.includes("kadın") || query.includes("women")) return "women";
    }
    return null;
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Top Search Bar */}
      <div className="bg-black text-white px-4 md:px-8 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün, Renk, Stil..."
                className="w-full bg-transparent border-b border-white/30 pl-12 pr-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={onClose}
              className="hover:opacity-70 transition-opacity p-2"
              aria-label="Kapat"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && searchQuery.length >= 2 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white/70">Öneriler:</span>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(suggestion)}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 overscroll-contain">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Category Badge */}
          {detectedCategory && (
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-black text-white text-sm uppercase tracking-wide">
                {detectedCategory === "men" ? "ERKEK" : "KADIN"}
              </span>
            </div>
          )}

          {/* Collections Section */}
          {filteredCollections.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-light uppercase tracking-wide">Koleksiyonlar:</h2>
                <Link
                  href="/collections"
                  className="text-xs text-gray-600 hover:text-black transition-colors"
                >
                  Tümünü Gör
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {filteredCollections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={collection.href}
                    onClick={onClose}
                    className="group bg-white p-3 hover:shadow-md transition-shadow flex-shrink-0 w-48"
                  >
                    <div className="relative aspect-[4/3] mb-2 overflow-hidden bg-gray-100">
                      <Image
                        src={collection.image}
                        alt={collection.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="192px"
                        unoptimized
                      />
                    </div>
                    <h3 className="text-xs font-light mb-1">{collection.title}</h3>
                    <span className="text-xs text-gray-600 hover:text-black transition-colors">
                      Daha Fazla Bilgi
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light uppercase tracking-wide">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aranıyor...
                </span>
              ) : (
                `Ürünler: ${filteredProducts.length > 0 ? `${filteredProducts.length} sonuç gösteriliyor` : "Sonuç bulunamadı"}`
              )}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="relevance">Öne Çıkanlar</option>
                <option value="price-low">Fiyat: Düşükten Yükseğe</option>
                <option value="price-high">Fiyat: Yüksekten Düşüğe</option>
                <option value="newest">En Yeni</option>
              </select>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Filters and Products Grid */}
          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <div className="hidden md:block w-56 flex-shrink-0">
              <div className="bg-white p-4 border border-gray-200">
                <h3 className="text-xs font-light uppercase tracking-wide mb-4">FİLTRELER</h3>
                <div className="space-y-4">
                  {/* Category Filter */}
                  <div>
                    <button
                      onClick={() => setOpenFilters(prev => ({ ...prev, category: !prev.category }))}
                      className="flex items-center justify-between w-full text-xs font-light mb-2 hover:opacity-70 transition-opacity"
                    >
                      <span>KATEGORİ</span>
                      {openFilters.category ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                    {openFilters.category && (
                      <div className="space-y-1.5 pl-2">
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={`block w-full text-left text-xs py-1 ${
                            selectedCategory === null ? "font-medium text-black" : "text-gray-600"
                          }`}
                        >
                          Tümü
                        </button>
                        <button
                          onClick={() => setSelectedCategory("men")}
                          className={`block w-full text-left text-xs py-1 ${
                            selectedCategory === "men" ? "font-medium text-black" : "text-gray-600"
                          }`}
                        >
                          Erkek
                        </button>
                        <button
                          onClick={() => setSelectedCategory("women")}
                          className={`block w-full text-left text-xs py-1 ${
                            selectedCategory === "women" ? "font-medium text-black" : "text-gray-600"
                          }`}
                        >
                          Kadın
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Size Filter */}
                  <div>
                    <button
                      onClick={() => setOpenFilters(prev => ({ ...prev, size: !prev.size }))}
                      className="flex items-center justify-between w-full text-xs font-light mb-2 hover:opacity-70 transition-opacity"
                    >
                      <span>BEDEN</span>
                      {openFilters.size ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                    {openFilters.size && (
                      <div className="grid grid-cols-3 gap-2 pl-2">
                        {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setSelectedSizes(prev =>
                                prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                              );
                            }}
                            className={`px-2 py-1.5 text-xs border transition-colors ${
                              selectedSizes.includes(size)
                                ? "border-black bg-black text-white"
                                : "border-gray-300 hover:border-black"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Color Filter */}
                  <div>
                    <button
                      onClick={() => setOpenFilters(prev => ({ ...prev, color: !prev.color }))}
                      className="flex items-center justify-between w-full text-xs font-light mb-2 hover:opacity-70 transition-opacity"
                    >
                      <span>RENK</span>
                      {openFilters.color ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                    {openFilters.color && (
                      <div className="grid grid-cols-4 gap-2 pl-2">
                        {[
                          { name: "Siyah", value: "#000000" },
                          { name: "Beyaz", value: "#FFFFFF" },
                          { name: "Gri", value: "#808080" },
                          { name: "Navy", value: "#1E3A8A" },
                          { name: "Bej", value: "#E8D5C4" },
                          { name: "Kahverengi", value: "#8B4513" },
                          { name: "Kırmızı", value: "#DC2626" },
                          { name: "Mavi", value: "#2563EB" },
                        ].map((color) => (
                          <button
                            key={color.name}
                            onClick={() => {
                              setSelectedColors(prev =>
                                prev.includes(color.name)
                                  ? prev.filter(c => c !== color.name)
                                  : [...prev, color.name]
                              );
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              selectedColors.includes(color.name)
                                ? "border-black scale-110"
                                : "border-gray-300 hover:border-gray-500"
                            }`}
                            style={{ backgroundColor: color.value }}
                            aria-label={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price Filter */}
                  <div>
                    <button
                      onClick={() => setOpenFilters(prev => ({ ...prev, price: !prev.price }))}
                      className="flex items-center justify-between w-full text-xs font-light mb-2 hover:opacity-70 transition-opacity"
                    >
                      <span>FİYAT</span>
                      {openFilters.price ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                    {openFilters.price && (
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                            className="w-20 px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:border-black"
                            placeholder="Min"
                          />
                          <span className="text-xs text-gray-600">-</span>
                          <input
                            type="number"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                            className="w-20 px-2 py-1 text-xs border border-gray-300 focus:outline-none focus:border-black"
                            placeholder="Max"
                          />
                        </div>
                        <div className="text-xs text-gray-600">
                          {priceRange[0]}₺ - {priceRange[1]}₺
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={product.slug ? `/products/${product.slug}` : `/product/${product.id}`}
                      onClick={onClose}
                      className="group"
                    >
                      <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover transition-opacity duration-500"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized
                        />
                        {product.hoverImage && (
                          <Image
                            src={product.hoverImage}
                            alt={`${product.title} hover`}
                            fill
                            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 absolute inset-0"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            unoptimized
                          />
                        )}
                        {product.badge && (
                          <div className="absolute top-3 left-3 bg-black text-white text-[10px] px-2 py-1 uppercase font-light">
                            {product.badge}
                          </div>
                        )}
                        <button
                          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          aria-label="Favorilere Ekle"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                        {/* Arrow Button - Bottom Right */}
                        <div className="absolute bottom-3 right-3 w-8 h-8 bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <ChevronRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <h3 className="text-sm font-light text-black mb-1">{product.title}</h3>
                      <div className="flex items-center gap-2">
                        {product.originalPrice && product.originalPrice > product.price ? (
                          <>
                            <p className="text-sm font-light text-black">{product.price} ₺</p>
                            <p className="text-xs font-light text-gray-500 line-through">{product.originalPrice} ₺</p>
                          </>
                        ) : (
                          <p className="text-sm font-light text-black">
                            {product.originalPrice ? product.originalPrice : product.price} ₺
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : searchQuery.length > 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 font-light">Aradığınız kriterlere uygun ürün bulunamadı.</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 font-light">Arama yapmak için yukarıdaki alana yazın.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
