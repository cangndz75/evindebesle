"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Plus, Trash2, ArrowRight } from "lucide-react";

type ProductBasics = {
  id: string;
  name: string;
  image?: string;
  price: number;
  stockCode?: string;
};

export default function AdminProductCombinationsPage() {
  const router = useRouter();

  const [mainSearch, setMainSearch] = useState("");
  const [mainResults, setMainResults] = useState<ProductBasics[]>([]);
  const [selectedMainProduct, setSelectedMainProduct] = useState<ProductBasics | null>(null);

  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedResults, setRelatedResults] = useState<ProductBasics[]>([]);

  const [combinations, setCombinations] = useState<any[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  // Debounced Main Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mainSearch.length >= 2) {
        fetchProducts(mainSearch).then(setMainResults);
      } else {
        setMainResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [mainSearch]);

  // Debounced Related Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (relatedSearch.length >= 2) {
        fetchProducts(relatedSearch).then(setRelatedResults);
      } else {
        setRelatedResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [relatedSearch]);

  const fetchProducts = async (q: string) => {
    try {
      const res = await fetch(`/api/admin-products?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const fetchCombinations = async (productId: string) => {
    setLoadingCombos(true);
    try {
      const res = await fetch(`/api/admin-product-combinations?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setCombinations(data);
      } else {
        setCombinations([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Kombinler yüklenemedi");
    } finally {
      setLoadingCombos(false);
    }
  };

  const handleSelectMainProduct = (p: ProductBasics) => {
    setSelectedMainProduct(p);
    setMainSearch("");
    setMainResults([]);
    fetchCombinations(p.id);
  };

  const clearMainProduct = () => {
    setSelectedMainProduct(null);
    setCombinations([]);
    setRelatedSearch("");
    setRelatedResults([]);
  };

  const handleAddCombination = async (related: ProductBasics) => {
    if (!selectedMainProduct) return;
    try {
      const res = await fetch("/api/admin-product-combinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedMainProduct.id,
          relatedProductId: related.id,
        }),
      });

      if (res.ok) {
        toast.success("Kombin eklendi!");
        fetchCombinations(selectedMainProduct.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Hata oluştu");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleRemoveCombination = async (relatedProductId: string) => {
    if (!selectedMainProduct) return;
    try {
      const res = await fetch(
        `/api/admin-product-combinations?productId=${selectedMainProduct.id}&relatedProductId=${relatedProductId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Kombin silindi!");
        fetchCombinations(selectedMainProduct.id);
      } else {
        toast.error("Silinemedi");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <div className="space-y-6 lg:p-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ürün Kombinleri (Takımı Tamamla)</h1>
        <p className="text-muted-foreground mt-2">
          Müşterilere "Takımı Tamamla" kısmında gösterilmek üzere ana ürüne kombin ürünler ekleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol Kolon: Ana Ürün Seçimi */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>1. Ana Ürün Seçin</CardTitle>
            <CardDescription>Hangi ürünün detay sayfasında kombinleri göstermek istiyorsunuz?</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {!selectedMainProduct ? (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün adı veya kodu ile ara..."
                  value={mainSearch}
                  onChange={(e) => setMainSearch(e.target.value)}
                  className="pl-9"
                />
                {mainResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {mainResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectMainProduct(p)}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                      >
                        {p.image ? (
                          <img src={p.image} className="w-10 h-10 object-cover rounded" alt={p.name} />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">Yok</div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.stockCode || "Kod yok"} - {p.price.toFixed(2)} ₺</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-4">
                  {selectedMainProduct.image ? (
                    <img src={selectedMainProduct.image} className="w-16 h-16 object-cover rounded shadow-sm" alt="Main" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded shadow-sm"></div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{selectedMainProduct.name}</h3>
                    <p className="text-muted-foreground text-sm">{selectedMainProduct.stockCode || "Kod Yok"}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={clearMainProduct}>
                  Değiştir
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sağ Kolon: Kombin Ekleme */}
        <Card className={`flex flex-col transition-opacity duration-200 ${!selectedMainProduct ? 'opacity-50 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle>2. Kombin Ürünleri Ekle</CardTitle>
            <CardDescription>Ana ürünle birlikte gösterilecek ürünleri seçin.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kombin edilecek ürünü ara..."
                value={relatedSearch}
                onChange={(e) => setRelatedSearch(e.target.value)}
                className="pl-9"
              />
              {relatedResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {relatedResults.map((p) => {
                    // Prevent showing already added or self
                    if (p.id === selectedMainProduct?.id) return null;
                    const isAlreadyAdded = combinations.some((c) => c.relatedProductId === p.id);
                    if (isAlreadyAdded) return null;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} className="w-10 h-10 object-cover rounded" alt={p.name} />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">Yok</div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.stockCode || "Kod yok"}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            handleAddCombination(p);
                            setRelatedSearch("");
                            setRelatedResults([]);
                          }}
                        >
                          <Plus className="w-4 h-4" /> Ekle
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eklenmiş Kombinler Tablosu */}
      {selectedMainProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Mevcut Kombinler ({combinations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCombos ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : combinations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu ürüne henüz kombin eklenmemiş.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Görsel</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Fiyat</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinations.map((combo) => (
                      <TableRow key={combo.id}>
                        <TableCell>
                          {combo.relatedProduct.image ? (
                            <img src={combo.relatedProduct.image} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded"></div>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{combo.relatedProduct.name}</p>
                          <p className="text-xs text-muted-foreground">{combo.relatedProduct.stockCode}</p>
                        </TableCell>
                        <TableCell>{combo.relatedProduct.price.toFixed(2)} ₺</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveCombination(combo.relatedProductId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
