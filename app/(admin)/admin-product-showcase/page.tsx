"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Plus, Trash2, ArrowUp, ArrowDown, Filter, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProductBasics = {
  id: string;
  name: string;
  image?: string;
  primaryImage?: string;
  price: number;
  stockCode?: string;
  colors?: any[];
};

type ShowcaseItem = {
  id: string;
  productId: string;
  order: number;
  product: ProductBasics;
};

export default function AdminShowcasePage() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductBasics[]>([]);
  
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2 || selectedCategoryId !== "all" || selectedGender !== "all") {
        setSearching(true);
        fetchProducts(search, selectedCategoryId, selectedGender)
          .then(setSearchResults)
          .finally(() => setSearching(false));
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedCategoryId, selectedGender]);

  useEffect(() => {
    fetchCategories();
    fetchShowcaseItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async (q: string, catId: string, gen: string) => {
    try {
      let url = `/api/admin-products?limit=20`;
      if (q) url += `&search=${encodeURIComponent(q)}`;
      if (catId !== "all") url += `&categoryId=${catId}`;
      if (gen !== "all") url += `&gender=${gen.toUpperCase()}`;
      
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const fetchShowcaseItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-showcase");
      if (res.ok) {
        const data = await res.json();
        setShowcaseItems(data);
      } else {
        setShowcaseItems([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Vitrin listesi yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (product: ProductBasics) => {
    if (showcaseItems.length >= 8) {
      toast.error("En fazla 8 ürün eklenebilir.");
      return;
    }
    try {
      const res = await fetch("/api/admin-showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (res.ok) {
        toast.success("Vitrine eklendi!");
        fetchShowcaseItems();
      } else {
        const err = await res.json();
        toast.error(err.error || "Hata oluştu");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin-showcase?productId=${productId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Vitrinden çıkarıldı!");
        fetchShowcaseItems();
      } else {
        toast.error("Silinemedi");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === showcaseItems.length - 1) return;

    const newItems = [...showcaseItems];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newItems[index].order;
    newItems[index].order = newItems[swapIndex].order;
    newItems[swapIndex].order = tempOrder;

    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setShowcaseItems([...newItems]);

    try {
      const reorderPayload = newItems.map(item => ({ id: item.id, order: item.order }));
      const res = await fetch("/api/admin-showcase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reorderPayload })
      });

      if (!res.ok) {
        toast.error("Sıralama güncellenemedi");
        fetchShowcaseItems(); // revert
      } else {
        toast.success("Sıralama güncellendi");
      }
    } catch (e) {
      toast.error("Sıralama yüklenirken hata oluştu");
    }
  };

  const getProductImage = (p: ProductBasics) => {
    if (p.primaryImage) return p.primaryImage;
    if (p.image) return p.image;
    if (p.colors && p.colors[0]?.images) {
      try {
         const parsed = typeof p.colors[0].images === 'string' ? JSON.parse(p.colors[0].images) : p.colors[0].images;
         if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return "https://via.placeholder.com/50";
  };

  return (
    <div className="space-y-6 lg:p-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ana Sayfa Vitrini (Showcase)</h1>
        <p className="text-muted-foreground mt-2">
          Ana sayfadaki ilk büyük slider'da (Product Showcase) görünecek en fazla 8 ürünü yönetin ve sırasını belirleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ürün Arama */}
        <Card>
          <CardHeader>
            <CardTitle>Ürün Ara ve Ekle</CardTitle>
            <CardDescription>İsme veya stok koduna göre arama yapabilirsiniz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün adı veya kodu yazın..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Cinsiyet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Cinsiyetler</SelectItem>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(search.length >= 2 || selectedCategoryId !== "all" || selectedGender !== "all") && searchResults.length === 0 && !searching && (
              <div className="text-center py-8 text-sm text-gray-400 font-light italic">
                Sonuç bulunamadı
              </div>
            )}

            {searching && (
               <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
               </div>
            )}

            <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {searchResults.map((product) => {
                const isAdded = showcaseItems.some(item => item.productId === product.id);
                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${isAdded ? 'bg-green-50/50 border-green-100 opacity-80' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={getProductImage(product)} 
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded shadow-sm border"
                      />
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.stockCode}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={isAdded ? "ghost" : "outline"}
                      onClick={() => handleAdd(product)}
                      disabled={showcaseItems.length >= 8 || isAdded}
                      className={isAdded ? "text-green-600 font-medium" : ""}
                    >
                      {isAdded ? (
                        <><Check className="w-4 h-4 mr-1" /> Eklendi</>
                      ) : (
                        <><Plus className="w-4 h-4 mr-1" /> Ekle</>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Vitrin Listesi */}
        <Card>
          <CardHeader>
             <CardTitle className="flex justify-between items-center">
                Vitrindeki Ürünler
                <span className="text-sm font-normal text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                   {showcaseItems.length} / 8 Eklendi
                </span>
             </CardTitle>
             <CardDescription>Vitrindeki ürünleri ve sırasını görüntüleyin</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="text-center py-4 text-sm text-gray-500">Yükleniyor...</div>
             ) : showcaseItems.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">Vitrinde henüz ürün yok.</div>
             ) : (
                <Table>
                   <TableHeader>
                      <TableRow>
                         <TableHead>Sıra</TableHead>
                         <TableHead>Resim</TableHead>
                         <TableHead>Ürün Adı</TableHead>
                         <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {showcaseItems.map((item, idx) => (
                        <TableRow key={item.id}>
                           <TableCell className="w-[100px]">
                              <div className="flex flex-col items-center justify-center space-y-1 bg-gray-50 p-1 rounded-md">
                                 <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="hover:bg-gray-200 p-1 rounded disabled:opacity-30">
                                    <ArrowUp className="w-3 h-3 text-gray-600" />
                                 </button>
                                 <span className="text-xs font-semibold">{idx + 1}</span>
                                 <button onClick={() => handleMove(idx, 'down')} disabled={idx === showcaseItems.length - 1} className="hover:bg-gray-200 p-1 rounded disabled:opacity-30">
                                    <ArrowDown className="w-3 h-3 text-gray-600" />
                                 </button>
                              </div>
                           </TableCell>
                           <TableCell>
                              <img src={getProductImage(item.product)} alt={item.product.name} className="w-12 h-12 object-cover rounded shadow border" />
                           </TableCell>
                           <TableCell className="font-medium text-sm">
                              {item.product.name}
                              <div className="text-xs text-muted-foreground mt-0.5">{item.product.stockCode}</div>
                           </TableCell>
                           <TableCell className="text-right">
                              <Button
                                 size="sm"
                                 variant="destructive"
                                 className="h-8 w-8 p-0"
                                 onClick={() => handleRemove(item.product.id)}
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
