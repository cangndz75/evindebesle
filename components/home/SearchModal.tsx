"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}


export default function SearchModal({ isOpen, onClose, initialQuery = "" }: SearchModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
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

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const searchProducts = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query && query.trim().length > 0) {
        params.set("q", query);
      }
      params.set("sortBy", sortBy);
      params.set("limit", query && query.trim().length > 0 ? "50" : "20");

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

        if (typeof window !== 'undefined') {
          import('@/lib/analytics-tracker').then(({ trackSearchEvent }) => {
            trackSearchEvent(query, data.products.length);
          });
        }

        if (query && query.trim().length > 0) {
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
          setSuggestions([]);
        }
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

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
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
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const root = modalRef.current;
      if (!root) return;

      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !root.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => Number(product.price) > 0);
  }, [products]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Arama"
      className="fixed inset-0 z-100 bg-white flex flex-col"
    >
      
      <div className="bg-black text-white px-4 md:px-8 py-6 shrink-0">
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

      
      <div className="flex-1 overflow-y-auto bg-gray-50 overscroll-contain">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          
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

          
          <div className="flex gap-6">
            
            <div className="hidden md:block w-56 shrink-0">
              <div className="bg-white p-4 border border-gray-200">
                <h3 className="text-xs font-light uppercase tracking-wide mb-4">FİLTRELER</h3>
                <div className="space-y-4">
                  
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
                          className={`block w-full text-left text-xs py-1 ${selectedCategory === null ? "font-medium text-black" : "text-gray-600"
                            }`}
                        >
                          Tümü
                        </button>
                        <button
                          onClick={() => setSelectedCategory("women")}
                          className={`block w-full text-left text-xs py-1 ${selectedCategory === "women" ? "font-medium text-black" : "text-gray-600"
                            }`}
                        >
                          Kadın
                        </button>
                        <button
                          onClick={() => setSelectedCategory("men")}
                          className={`block w-full text-left text-xs py-1 ${selectedCategory === "men" ? "font-medium text-black" : "text-gray-600"
                            }`}
                        >
                          Erkek
                        </button>
                      </div>
                    )}
                  </div>

                  
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
                            className={`px-2 py-1.5 text-xs border transition-colors ${selectedSizes.includes(size)
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
                            className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColors.includes(color.name)
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
                      <div className="relative aspect-3/4 mb-4 overflow-hidden bg-gray-100">
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
                  <p className="text-gray-600 font-light">Şu an gösterilecek ürün bulunamadı.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
