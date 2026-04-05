"use client";

import { useEffect, useState, Fragment } from "react";
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
import {
  AlertTriangle,
  Package,
  ChevronDown,
  ChevronRight,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import StockUpdateModal from "./_components/StockUpdateModal";

type StockItem = {
  docId: string;
  productId: string;
  productName: string;
  colorId: string | null;
  colorName: string | null;
  image: string | null;
  stockCode: string | null;
  totalStock: number;
  minStock: number;
  subVariants: Array<{
    variantId: string;
    size: string;
    stock: number;
    isVariant: boolean;
  }>;
};

export default function StockManagementPage() {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lowStock" | "outOfStock">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [selectedProductForModal, setSelectedProductForModal] = useState<string | null>(null);

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
        setItems(data.products || []); // API returns 'products' key but with new structure
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Stok verileri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (docId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedRows(newExpanded);
  };

  const handleQuickUpdate = async (variantId: string, isVariant: boolean, newStock: number) => {
    try {

      const res = await fetch(`/api/admin/products/stock-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          isVariant,
          stock: newStock
        })
      });

      if (res.ok) {
        toast.success("Stok güncellendi");
        fetchStockData();
      } else {
        throw new Error("Güncelleme başarısız");
      }
    } catch (error) {
      toast.error("Güncelleme hatası");
      console.error(error);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.productName.toLowerCase().includes(query) ||
      (item.stockCode && item.stockCode.toLowerCase().includes(query)) ||
      (item.colorName && item.colorName.toLowerCase().includes(query))
    );
  });

  const lowStockCount = items.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStock).length;
  const outOfStockCount = items.filter((p) => p.totalStock === 0).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Stok ve Tedarik</h1>
          <p className="text-sm text-gray-600 mt-1">
            Ürün varyantlarını hızlıca yönetin
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={() => router.push("/admin-stock/movements")}>
            <Package className="w-4 h-4 mr-2" />
            Geçmiş Hareketler
          </Button>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Kalem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
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

      
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Ürün adı, renk veya stok kodu..."
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

      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Kayıt bulunamadı
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Stok Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Renk</TableHead>
                    <TableHead>Stok Kodu</TableHead>
                    <TableHead>Toplam Stok</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isExpanded = expandedRows.has(item.docId);
                    const isOutOfStock = item.totalStock === 0;
                    const isLowStock = !isOutOfStock && item.totalStock <= item.minStock;

                    return (
                      <Fragment key={item.docId}>
                        <TableRow key={item.docId} className={isExpanded ? "bg-muted/50 border-b-0" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <span className="font-medium">{item.productName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.colorName ? (
                              <Badge variant="outline">{item.colorName}</Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.stockCode || "-"}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold">{item.totalStock}</span>
                          </TableCell>
                          <TableCell>
                            {isOutOfStock ? (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Tükendi</Badge>
                            ) : isLowStock ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Kritik</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Yeterli</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleRow(item.docId)}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setSelectedProductForModal(item.productId)}
                            >
                              Stok Güncelle
                            </Button>
                          </TableCell>
                        </TableRow>

                        
                        {isExpanded && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={7}>
                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {item.subVariants.map((sub) => (
                                  <div key={sub.variantId} className="flex items-center gap-2 bg-white p-2 rounded border">
                                    <div className="flex-1">
                                      <div className="text-xs text-gray-500 font-medium">Beden</div>
                                      <div className="font-semibold">{sub.size}</div>
                                    </div>
                                    <div className="w-[80px]">
                                      <Input
                                        type="number"
                                        defaultValue={sub.stock}
                                        className="h-8 text-right"
                                        min={0}
                                        onChange={(e) => setEditingStock({
                                          ...editingStock,
                                          [sub.variantId]: parseInt(e.target.value) || 0
                                        })}
                                      />
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => {
                                        const val = editingStock[sub.variantId];
                                        if (val !== undefined) {
                                          handleQuickUpdate(sub.variantId, sub.isVariant, val);
                                        }
                                      }}
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProductForModal && (
        <StockUpdateModal
          productId={selectedProductForModal}
          isOpen={!!selectedProductForModal}
          onClose={() => {
            setSelectedProductForModal(null);
            fetchStockData();
          }}
        />
      )}
    </div>
  );
}
