"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, TrendingDown, TrendingUp, Search, Filter } from "lucide-react";
import { toast } from "sonner";

type StockProduct = {
  id: string;
  name: string;
  stockCode: string | null;
  image: string | null;
  price: number;
  totalStock: number;
  minStock: number;
  sizes: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
  variants: Array<{
    id: string;
    colorName: string | null;
    sizeName: string | null;
    stock: number;
  }>;
};

export default function StockManagementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lowStock" | "outOfStock">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockMovements, setStockMovements] = useState<any[]>([]);

  useEffect(() => {
    fetchStockData();
  }, [filter]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("filter", filter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/stock?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setStockMovements(data.movements || []);
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Stok verileri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId: string, sizeId: string, newStock: number) => {
    try {
      const res = await fetch(`/api/admin/stock/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizeId, stock: newStock }),
      });

      if (res.ok) {
        toast.success("Stok güncellendi");
        fetchStockData();
      } else {
        throw new Error("Güncelleme başarısız");
      }
    } catch (error) {
      toast.error("Stok güncellenirken bir hata oluştu");
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.stockCode && product.stockCode.toLowerCase().includes(query))
    );
  });

  const lowStockCount = products.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStock).length;
  const outOfStockCount = products.filter((p) => p.totalStock === 0).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Stok ve Tedarik</h1>
          <p className="text-sm text-gray-600 mt-1">Stok durumunu takip edin ve yönetin</p>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Ürün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Düşük Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="w-4 h-4 text-red-500" />
              Tükenen Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Ürün adı veya stok kodu ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="lowStock">Düşük Stok</SelectItem>
            <SelectItem value="outOfStock">Tükenen Stok</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ürün Listesi */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Ürün bulunamadı
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Stok Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Stok Kodu</TableHead>
                    <TableHead>Toplam Stok</TableHead>
                    <TableHead>Min. Stok</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Varyantlar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const isLowStock = product.totalStock > 0 && product.totalStock <= product.minStock;
                    const isOutOfStock = product.totalStock === 0;

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.price.toFixed(2)} ₺</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{product.stockCode || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{product.totalStock}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{product.minStock || 5}</span>
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <Badge className="bg-red-100 text-red-800">Tükendi</Badge>
                          ) : isLowStock ? (
                            <Badge className="bg-amber-100 text-amber-800">Düşük</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">Yeterli</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {product.variants.length > 0 ? (
                              product.variants.slice(0, 2).map((variant, idx) => (
                                <div key={idx} className="text-xs">
                                  {variant.colorName || variant.sizeName}: {variant.stock}
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400">Varyant yok</span>
                            )}
                            {product.variants.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{product.variants.length - 2} daha
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin-products?productId=${product.id}`)}
                          >
                            Stok Güncelle
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stok Hareketleri */}
      <Card>
        <CardHeader>
          <CardTitle>Son Stok Hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          {stockMovements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Henüz stok hareketi kaydı yok
            </p>
          ) : (
            <div className="space-y-2">
              {stockMovements.slice(0, 10).map((movement, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{movement.productName}</p>
                    <p className="text-xs text-gray-500">{movement.type}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      movement.type === "Giriş" ? "text-green-600" : "text-red-600"
                    }`}>
                      {movement.type === "Giriş" ? "+" : "-"}{movement.quantity}
                    </p>
                    <p className="text-xs text-gray-500">{movement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
