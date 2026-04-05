"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Plus, Trash2, ArrowUp, ArrowDown, Check } from "lucide-react";
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

type TabbedItem = {
  id: string;
  productId: string;
  tab: string;
  order: number;
  product: ProductBasics;
};

export default function AdminTabbedCarouselPage() {
  const [activeTab, setActiveTab] = useState("new-arrivals");

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductBasics[]>([]);
  
  const [tabItems, setTabItems] = useState<TabbedItem[]>([]);
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
    fetchTabItems();
  }, [activeTab]);

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

  const fetchTabItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-tabbed-carousel?tab=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setTabItems(data);
      } else {
        setTabItems([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (product: ProductBasics) => {
    if (tabItems.length >= 15) {
      toast.error("En fazla 15 ürün eklenebilir.");
      return;
    }
    try {
      const res = await fetch("/api/admin-tabbed-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, tab: activeTab }),
      });

      if (res.ok) {
        toast.success("Sekmeye eklendi!");
        fetchTabItems();
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
      const res = await fetch(`/api/admin-tabbed-carousel?productId=${productId}&tab=${activeTab}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Listeden çıkarıldı!");
        fetchTabItems();
      } else {
        toast.error("Silinemedi");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tabItems.length - 1) return;

    const newItems = [...tabItems];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newItems[index].order;
    newItems[index].order = newItems[swapIndex].order;
    newItems[swapIndex].order = tempOrder;

    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setTabItems([...newItems]);

    try {
      const reorderPayload = newItems.map(item => ({ id: item.id, order: item.order }));
      const res = await fetch("/api/admin-tabbed-carousel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reorderPayload, tab: activeTab })
      });

      if (!res.ok) {
        toast.error("Sıralama güncellenemedi");
        fetchTabItems(); // revert
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
        <h1 className="text-3xl font-bold tracking-tight">Sekmeli Kaydırıcılar (Carousel)</h1>
        <p className="text-muted-foreground mt-2">
          Ana sayfadaki sekmeli kaydırıcıdaki ürünleri (Yeni Gelenler, Çok Satanlar, Önerilenler) yönetin.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="new-arrivals">Yeni Gelenler</TabsTrigger>
          <TabsTrigger value="best-sellers">Çok Satanlar</TabsTrigger>
          <TabsTrigger value="recommended">Önerilenler</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Ürün Arama */}
          <Card>
            <CardHeader>
              <CardTitle>Ürün Ara ve Ekle</CardTitle>
              <CardDescription>İlgili sekmeye eklemek için arama yapın</CardDescription>
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
                  const isAdded = tabItems.some(item => item.productId === product.id);
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${isAdded ? 'bg-green-50/50 border-green-100 opacity-80' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
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
                        disabled={tabItems.length >= 15 || isAdded}
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

          {/* Mevcut Liste */}
          <Card>
            <CardHeader>
               <CardTitle className="flex justify-between items-center">
                  Ekli Ürünler
                  <span className="text-sm font-normal text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                     {tabItems.length} / 15 Eklendi
                  </span>
               </CardTitle>
               <CardDescription>Bu sekmedeki ürünleri sıralayın veya çıkartın</CardDescription>
            </CardHeader>
            <CardContent>
               {loading ? (
                  <div className="text-center py-4 text-sm text-gray-500">Yükleniyor...</div>
               ) : tabItems.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">Bu sekmede henüz ürün yok.</div>
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
                        {tabItems.map((item, idx) => (
                          <TableRow key={item.id}>
                             <TableCell className="w-[100px]">
                                <div className="flex flex-col items-center justify-center space-y-1 bg-gray-50 p-1 rounded-md">
                                   <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="hover:bg-gray-200 p-1 rounded disabled:opacity-30">
                                      <ArrowUp className="w-3 h-3 text-gray-600" />
                                   </button>
                                   <span className="text-xs font-semibold">{idx + 1}</span>
                                   <button onClick={() => handleMove(idx, 'down')} disabled={idx === tabItems.length - 1} className="hover:bg-gray-200 p-1 rounded disabled:opacity-30">
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
      </Tabs>
    </div>
  );
}
