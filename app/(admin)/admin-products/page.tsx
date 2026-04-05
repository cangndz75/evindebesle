"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeftIcon, ChevronRightIcon, Edit, Trash2, ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { InlineEditableCell } from "./_components/InlineEditableCell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  stockCode?: string;
  description?: string;
  price: number;
  image?: string;
  gender?: "MALE" | "FEMALE" | "UNISEX";
  sizeType?: "LETTER" | "NUMBER";
  isActive: boolean;
  createdAt: string;
  colors?: Array<{ name: string; images: string[] }>;
  sizes?: Array<{ name: string; stock: number }>;
  tags?: Array<{ name: string }>;
  sizeOptions?: Array<{ name: string }>;
  combinations?: Array<{ relatedProductId: string }>;
  reviews?: Array<{ rating: number; isApproved: boolean }>;
};

type ProductColor = {
  id: string;
  name: string;
  hexCode?: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [deleteAll, setDeleteAll] = useState(false);
  const [loadingColors, setLoadingColors] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [stockStatus, setStockStatus] = useState<"all" | "inStock" | "outOfStock" | "lowStock">("all");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "newest" | "oldest">("newest");
  const [gender, setGender] = useState<string>("");
  const [sizeType, setSizeType] = useState<string>("");
  const [minStock, setMinStock] = useState<string>("");
  const [maxStock, setMaxStock] = useState<string>("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = (search?: string, filters?: {
    stockStatus?: string;
    sortBy?: string;
    gender?: string;
    sizeType?: string;
    minStock?: string;
    maxStock?: string;
  }) => {
    setLoading(true);
    const params = new URLSearchParams();
    
    if (search) params.append("search", search);
    if (filters?.stockStatus && filters.stockStatus !== "all") params.append("stockStatus", filters.stockStatus);
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.gender) params.append("gender", filters.gender);
    if (filters?.sizeType) params.append("sizeType", filters.sizeType);
    if (filters?.minStock) params.append("minStock", filters.minStock);
    if (filters?.maxStock) params.append("maxStock", filters.maxStock);
    
    const url = `/api/admin-products?${params.toString()}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        if (!text) {
          return [];
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("JSON parse hatası:", e, "Response text:", text);
          throw new Error("Geçersiz JSON yanıtı");
        }
      })
      .then((res) => {
        setData(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ürünler yüklenirken hata:", err);
        setData([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts(searchQuery, {
      stockStatus,
      sortBy,
      gender,
      sizeType,
      minStock,
      maxStock,
    });
  }, [stockStatus, sortBy, gender, sizeType, minStock, maxStock]);

  const handleApplyFilters = () => {
    fetchProducts(searchQuery, {
      stockStatus,
      sortBy,
      gender,
      sizeType,
      minStock,
      maxStock,
    });
    setFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setStockStatus("all");
    setSortBy("newest");
    setGender("");
    setSizeType("");
    setMinStock("");
    setMaxStock("");
    fetchProducts(searchQuery, {
      stockStatus: "all",
      sortBy: "newest",
    });
    setFilterModalOpen(false);
  };

  const refresh = () => {
    fetchProducts(searchQuery, {
      stockStatus,
      sortBy,
      gender,
      sizeType,
      minStock,
      maxStock,
    });
  };

  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(val) => row.toggleSelected(!!val)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 20,
    },
    {
      header: "Görsel",
      accessorKey: "image",
      cell: ({ row }) => {
        const url = row.original.image;
        return url ? (
          <img src={url} alt="Product" className="w-10 h-10 object-cover rounded" />
        ) : (
          <div className="w-10 h-10 bg-muted flex items-center justify-center text-xs text-muted-foreground rounded">
            Yok
          </div>
        );
      },
    },
    {
      header: "Ürün Adı",
      accessorKey: "name",
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/admin-products/${row.original.id}`)}
          className="font-medium min-w-[150px] text-left hover:text-blue-600 hover:underline"
        >
          {row.getValue("name")}
        </button>
      ),
    },
    {
      header: "Stok Kodu",
      accessorKey: "stockCode",
      cell: ({ row }) => {
        const code = row.original.stockCode;
        return (
          <div className="text-sm text-muted-foreground min-w-[100px]">
            {code || "-"}
          </div>
        );
      },
    },
    {
      header: "Cinsiyet",
      accessorKey: "gender",
      cell: ({ row }) => {
        const gender = row.original.gender;
        const genderMap: Record<string, string> = {
          MALE: "Erkek",
          FEMALE: "Kadın",
          UNISEX: "Unisex",
        };
        return (
          <div className="text-sm min-w-[80px]">
            {gender ? genderMap[gender] || gender : "-"}
          </div>
        );
      },
    },
    {
      header: "Beden Tipi",
      accessorKey: "sizeType",
      cell: ({ row }) => {
        const sizeType = row.original.sizeType;
        return (
          <div className="text-sm min-w-[100px]">
            {sizeType === "LETTER" ? "Harf" : sizeType === "NUMBER" ? "Numara" : "-"}
          </div>
        );
      },
    },
    {
      header: "Renkler",
      accessorKey: "colors",
      cell: ({ row }) => {
        const colors = row.original.colors || [];
        return (
          <div className="flex flex-wrap gap-1 min-w-[120px]">
            {colors.length > 0 ? (
              colors.slice(0, 3).map((color, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {color.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
            {colors.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{colors.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: "Bedenler",
      accessorKey: "sizes",
      cell: ({ row }) => {
        const sizes = row.original.sizes || [];
        const totalStock = sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
        return (
          <div className="min-w-[120px]">
            <div className="text-sm font-medium">
              {sizes.length > 0 ? `${sizes.length} beden` : "-"}
            </div>
            {totalStock > 0 && (
              <div className="text-xs text-muted-foreground">
                Toplam: {totalStock}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Fiyat",
      accessorKey: "price",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <InlineEditableCell
            value={product.price}
            onSave={async (value) => {
              const res = await fetch(`/api/admin-products/${product.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price: value }),
              });
              if (!res.ok) throw new Error("Güncelleme başarısız");
              refresh();
            }}
            type="number"
            format={(val) => `${Number(val).toFixed(2)} ₺`}
            className="font-medium min-w-[100px]"
          />
        );
      },
    },
    {
      header: "Stok",
      accessorKey: "stock",
      cell: ({ row }) => {
        const product = row.original;
        const totalStock = (product.sizes || []).reduce((sum, s) => sum + (s.stock || 0), 0);
        return (
          <InlineEditableCell
            value={totalStock}
            onSave={async (value) => {
              if (product.sizes && product.sizes.length > 0) {
                const stockPerSize = Math.floor(Number(value) / product.sizes.length);
                const promises = (product.sizes ?? []).map((size: any, idx: number) => {
                  const sizesLength = product.sizes ? product.sizes.length : 1;
                  const stock = idx === 0 
                    ? Number(value) - (stockPerSize * (sizesLength - 1))
                    : stockPerSize;
                  return fetch(`/api/admin-products/${product.id}/sizes/${size.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stock }),
                  });
                });
                await Promise.all(promises);
              }
              refresh();
            }}
            type="number"
            className="font-medium min-w-[100px]"
          />
        );
      },
    },
    {
      header: "Kalite",
      id: "quality",
      cell: ({ row }) => {
        const product = row.original;
        const warnings: string[] = [];
        
        if (!product.image) warnings.push("Görsel eksik");
        if (!product.colors || product.colors.length === 0) warnings.push("Varyant eksik");
        if (!product.sizes || product.sizes.length === 0) warnings.push("Beden eksik");
        if (!product.description) warnings.push("Açıklama eksik");
        if (!product.stockCode) warnings.push("SKU eksik");

        if (warnings.length === 0) {
          return <Badge className="bg-green-100 text-green-800">Tamam</Badge>;
        }

        return (
          <div className="flex flex-col gap-1 min-w-[120px]">
            {warnings.slice(0, 2).map((warning, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-amber-50 text-amber-700">
                {warning}
              </Badge>
            ))}
            {warnings.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{warnings.length - 2} daha
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: "Durum",
      accessorKey: "isActive",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"} className="min-w-[70px]">
            {isActive ? "Aktif" : "Pasif"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={() => router.push(`/admin-products/${row.original.id}/edit`)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536M4 13v7h7l9-9-7-7-9 9z"
              />
            </svg>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={async () => {
              setDeleteId(row.original.id);
              setLoadingColors(true);
              setProductColors([]);
              setSelectedColorIds([]);
              setDeleteAll(false);
              
              try {
                const response = await fetch(`/api/admin-products/${row.original.id}`);
                if (response.ok) {
                  const productData = await response.json();
                  if (productData.colors && Array.isArray(productData.colors) && productData.colors.length > 0) {
                    setProductColors(productData.colors.map((c: any) => ({
                      id: c.id,
                      name: c.name,
                      hexCode: c.hexCode,
                    })));
                  } else {
                    setDeleting(true);
                    try {
                      const deleteResponse = await fetch(`/api/admin-products/${row.original.id}`, {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          deleteAll: true,
                          colorIds: [],
                        }),
                      });

                      if (!deleteResponse.ok) {
                        const error = await deleteResponse.json();
                        toast.error(error.error || "Silme işlemi başarısız oldu");
                        setDeleteId(null);
                        return;
                      }

                      toast.success("Ürün başarıyla silindi");
                      setDeleteId(null);
                      refresh();
                    } catch (error) {
                      console.error("Silme hatası:", error);
                      toast.error("Silme işlemi sırasında bir hata oluştu");
                      setDeleteId(null);
                    } finally {
                      setDeleting(false);
                    }
                  }
                }
              } catch (error) {
                console.error("Renkler yüklenirken hata:", error);
                toast.error("Ürün bilgileri yüklenirken bir hata oluştu");
                setDeleteId(null);
              } finally {
                setLoadingColors(false);
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m-4 0h14"
              />
            </svg>
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 100,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, pagination, columnFilters, columnVisibility },
  });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const genderMap: Record<string, string> = {
    MALE: "Erkek",
    FEMALE: "Kadın",
    UNISEX: "Unisex",
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header - Mobilde daha kompakt */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Ürün adı, SKU, açıklama..."
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                if (value.length >= 2 || value.length === 0) {
                  fetchProducts(value, {
                    stockStatus,
                    sortBy,
                    gender,
                    sizeType,
                    minStock,
                    maxStock,
                  });
                }
              }}
              className="w-full h-10 md:h-10 pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 px-4">
                <Filter className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Filtrele</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[500px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-bold">Filtrele ve Sırala</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6 pb-6">
                {/* Sıralama */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Sıralama</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={sortBy === "name" ? "default" : "outline"}
                      className={`h-10 ${sortBy === "name" ? "bg-black text-white" : ""}`}
                      onClick={() => setSortBy("name")}
                    >
                      Ada göre
                    </Button>
                    <Button
                      variant={sortBy === "stock" ? "default" : "outline"}
                      className={`h-10 ${sortBy === "stock" ? "bg-black text-white" : ""}`}
                      onClick={() => setSortBy("stock")}
                    >
                      Stoka göre
                    </Button>
                    <Button
                      variant={sortBy === "newest" ? "default" : "outline"}
                      className={`h-10 ${sortBy === "newest" ? "bg-black text-white" : ""}`}
                      onClick={() => setSortBy("newest")}
                    >
                      En yeni
                    </Button>
                    <Button
                      variant={sortBy === "oldest" ? "default" : "outline"}
                      className={`h-10 ${sortBy === "oldest" ? "bg-black text-white" : ""}`}
                      onClick={() => setSortBy("oldest")}
                    >
                      En eski
                    </Button>
                  </div>
                </div>

                {/* Kategori (Cinsiyet) */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Kategori</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={gender === "MALE" ? "default" : "outline"}
                      className={`h-10 ${gender === "MALE" ? "bg-black text-white" : ""}`}
                      onClick={() => setGender(gender === "MALE" ? "" : "MALE")}
                    >
                      Erkek
                    </Button>
                    <Button
                      variant={gender === "FEMALE" ? "default" : "outline"}
                      className={`h-10 ${gender === "FEMALE" ? "bg-black text-white" : ""}`}
                      onClick={() => setGender(gender === "FEMALE" ? "" : "FEMALE")}
                    >
                      Kadın
                    </Button>
                    <Button
                      variant={gender === "UNISEX" ? "default" : "outline"}
                      className={`h-10 ${gender === "UNISEX" ? "bg-black text-white" : ""}`}
                      onClick={() => setGender(gender === "UNISEX" ? "" : "UNISEX")}
                    >
                      Unisex
                    </Button>
                  </div>
                </div>

                {/* Beden Tipi */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Beden Tipi</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={sizeType === "LETTER" ? "default" : "outline"}
                      className={`h-10 ${sizeType === "LETTER" ? "bg-black text-white" : ""}`}
                      onClick={() => setSizeType(sizeType === "LETTER" ? "" : "LETTER")}
                    >
                      Harf (XS, S, M...)
                    </Button>
                    <Button
                      variant={sizeType === "NUMBER" ? "default" : "outline"}
                      className={`h-10 ${sizeType === "NUMBER" ? "bg-black text-white" : ""}`}
                      onClick={() => setSizeType(sizeType === "NUMBER" ? "" : "NUMBER")}
                    >
                      Numara (30, 32...)
                    </Button>
                  </div>
                </div>

                {/* Stok Aralığı */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Stok Aralığı</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="h-10"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxStock}
                      onChange={(e) => setMaxStock(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="flex-1 h-12"
                >
                  Sıfırla
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1 h-12 bg-black text-white hover:bg-gray-800"
                >
                  Uygula
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Stok Durumu Filtreleri */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={stockStatus === "all" ? "default" : "outline"}
            size="sm"
            className={`whitespace-nowrap h-9 ${stockStatus === "all" ? "bg-black text-white" : ""}`}
            onClick={() => setStockStatus("all")}
          >
            Tümü
          </Button>
          <Button
            variant={stockStatus === "inStock" ? "default" : "outline"}
            size="sm"
            className={`whitespace-nowrap h-9 ${stockStatus === "inStock" ? "bg-black text-white" : ""}`}
            onClick={() => setStockStatus("inStock")}
          >
            Stokta
          </Button>
          <Button
            variant={stockStatus === "outOfStock" ? "default" : "outline"}
            size="sm"
            className={`whitespace-nowrap h-9 ${stockStatus === "outOfStock" ? "bg-black text-white" : ""}`}
            onClick={() => setStockStatus("outOfStock")}
          >
            Tükendi
          </Button>
          <Button
            variant={stockStatus === "lowStock" ? "default" : "outline"}
            size="sm"
            className={`whitespace-nowrap h-9 ${stockStatus === "lowStock" ? "bg-black text-white" : ""}`}
            onClick={() => setStockStatus("lowStock")}
          >
            Düşük Stok
          </Button>
        </div>

        <div className="flex-shrink-0">
          <Button
            onClick={() => router.push("/admin-products/add")}
            className="bg-black text-white hover:bg-gray-800"
          >
            Yeni Ürün Ekle
          </Button>
        </div>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {[...Array(columns.length)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="p-4">
              <Skeleton className="h-32 w-full" />
            </Card>
          ))
        ) : table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const product = row.original;
            const isExpanded = expandedRows.has(product.id);
            const totalStock = (product.sizes || []).reduce((sum, s) => sum + (s.stock || 0), 0);
            
            return (
              <Card key={product.id} className="border border-gray-200 overflow-hidden">
                <CardContent className="p-0">
                  {/* Ana Bilgiler */}
                  <div className="p-4 flex gap-3">
                    {/* Görsel */}
                    <div className="flex-shrink-0">
                      {product.image ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                          Görsel Yok
                        </div>
                      )}
                    </div>

                    {/* Ürün Bilgileri */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">
                            {product.name}
                          </h3>
                          {product.stockCode && (
                            <p className="text-xs text-gray-500 mt-1">
                              {product.stockCode}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={product.isActive ? "default" : "secondary"}
                          className="text-xs flex-shrink-0"
                        >
                          {product.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>

                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <div>
                          <span className="text-xs text-gray-500">Fiyat:</span>
                          <span className="text-sm font-semibold text-gray-900 ml-1">
                            {product.price.toFixed(2)} ₺
                          </span>
                        </div>
                        {totalStock > 0 && (
                          <div>
                            <span className="text-xs text-gray-500">Stok:</span>
                            <span className="text-sm font-medium text-gray-900 ml-1">
                              {totalStock}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Hızlı Bilgiler */}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {product.gender && (
                          <Badge variant="outline" className="text-xs">
                            {genderMap[product.gender] || product.gender}
                          </Badge>
                        )}
                        {product.sizeType && (
                          <Badge variant="outline" className="text-xs">
                            {product.sizeType === "LETTER" ? "Harf" : "Numara"}
                          </Badge>
                        )}
                        {(product.colors || []).length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {(product.colors || []).length} Renk
                          </Badge>
                        )}
                        {(product.sizes || []).length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {(product.sizes || []).length} Beden
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detaylar Butonu ve İşlemler */}
                  <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(product.id)}
                      className="text-xs h-8"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Detayları Gizle
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Detayları Göster
                        </>
                      )}
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => router.push(`/admin-products/${product.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={async () => {
                          setDeleteId(product.id);
                          setLoadingColors(true);
                          setProductColors([]);
                          setSelectedColorIds([]);
                          setDeleteAll(false);
                          
                          try {
                            const response = await fetch(`/api/admin-products/${product.id}`);
                            if (response.ok) {
                              const productData = await response.json();
                  if (productData.colors && Array.isArray(productData.colors) && productData.colors.length > 0) {
                    setProductColors(productData.colors.map((c: any) => ({
                      id: c.id,
                      name: c.name,
                      hexCode: c.hexCode,
                    })));
                  } else {
                    setDeleting(true);
                    try {
                      const deleteResponse = await fetch(`/api/admin-products/${product.id}`, {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          deleteAll: true,
                          colorIds: [],
                        }),
                      });

                      if (!deleteResponse.ok) {
                        const error = await deleteResponse.json();
                        toast.error(error.error || "Silme işlemi başarısız oldu");
                        setDeleteId(null);
                        return;
                      }

                      toast.success("Ürün başarıyla silindi");
                      setDeleteId(null);
                      refresh();
                    } catch (error) {
                      console.error("Silme hatası:", error);
                      toast.error("Silme işlemi sırasında bir hata oluştu");
                      setDeleteId(null);
                    } finally {
                      setDeleting(false);
                    }
                  }
                }
              } catch (error) {
                console.error("Renkler yüklenirken hata:", error);
                toast.error("Ürün bilgileri yüklenirken bir hata oluştu");
                setDeleteId(null);
              } finally {
                setLoadingColors(false);
              }
            }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Genişletilmiş Detaylar */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 space-y-3 bg-white">
                      {product.stockCode && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Stok Kodu:</span>
                          <p className="text-sm text-gray-900 mt-1">{product.stockCode}</p>
                        </div>
                      )}
                      {product.description && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Açıklama:</span>
                          <p className="text-sm text-gray-900 mt-1">{product.description}</p>
                        </div>
                      )}
                      {(product.colors || []).length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Renkler:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.colors!.map((color, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {color.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {(product.sizes || []).length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Bedenler:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {product.sizes!.map((size, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium">{size.name}:</span>
                                <span className="text-gray-600 ml-1">{size.stock || 0}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Kayıt bulunamadı</p>
          </Card>
        )}
      </div>
      <Dialog 
        open={!!deleteId} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setProductColors([]);
            setSelectedColorIds([]);
            setDeleteAll(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Silme İşlemi</DialogTitle>
          </DialogHeader>
          {deleteId && (
            <div className="space-y-4">
              {loadingColors ? (
                <div className="text-center py-4">Renkler yükleniyor...</div>
              ) : productColors.length > 0 ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Bu ürünün {productColors.length} rengi bulunmaktadır. Silmek istediğiniz renkleri seçin veya tümünü silin.
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deleteAll"
                        checked={deleteAll}
                        onCheckedChange={(checked) => {
                          setDeleteAll(checked === true);
                          if (checked) {
                            setSelectedColorIds([]);
                          }
                        }}
                      />
                      <label
                        htmlFor="deleteAll"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Tümünü Sil (Ürün ve tüm renkleri)
                      </label>
                    </div>

                    {!deleteAll && (
                      <div className="space-y-2 border rounded-md p-3 max-h-60 overflow-y-auto">
                        <div className="text-sm font-medium mb-2">Renkleri Seç:</div>
                        {productColors.map((color) => (
                          <div key={color.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`color-${color.id}`}
                              checked={selectedColorIds.includes(color.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedColorIds([...selectedColorIds, color.id]);
                                } else {
                                  setSelectedColorIds(selectedColorIds.filter(id => id !== color.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`color-${color.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                            >
                              {color.hexCode && (
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: color.hexCode }}
                                />
                              )}
                              {color.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteId(null);
                setProductColors([]);
                setSelectedColorIds([]);
                setDeleteAll(false);
              }}
              disabled={deleting}
            >
              Vazgeç
            </Button>
            <Button
              onClick={async () => {
                if (!deleteId) return;
                
                if (productColors.length === 0) {
                  setDeleting(true);
                  try {
                    const response = await fetch(`/api/admin-products/${deleteId}`, {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        deleteAll: true,
                        colorIds: [],
                      }),
                    });

                    if (!response.ok) {
                      const error = await response.json();
                      toast.error(error.error || "Silme işlemi başarısız oldu");
                      return;
                    }

                    toast.success("Ürün başarıyla silindi");
                    setDeleteId(null);
                    setProductColors([]);
                    setSelectedColorIds([]);
                    setDeleteAll(false);
                    refresh();
                  } catch (error) {
                    console.error("Silme hatası:", error);
                    toast.error("Silme işlemi sırasında bir hata oluştu");
                  } finally {
                    setDeleting(false);
                  }
                  return;
                }
                
                if (!deleteAll && selectedColorIds.length === 0) {
                  toast.error("Lütfen silinecek renkleri seçin veya 'Tümünü Sil' seçeneğini işaretleyin.");
                  return;
                }

                setDeleting(true);
                try {
                  const response = await fetch(`/api/admin-products/${deleteId}`, {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      deleteAll,
                      colorIds: deleteAll ? [] : selectedColorIds,
                    }),
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    toast.error(error.error || "Silme işlemi başarısız oldu");
                    return;
                  }

                  toast.success("Silme işlemi başarıyla tamamlandı");
                  setDeleteId(null);
                  setProductColors([]);
                  setSelectedColorIds([]);
                  setDeleteAll(false);
                  refresh();
                } catch (error) {
                  console.error("Silme hatası:", error);
                  toast.error("Silme işlemi sırasında bir hata oluştu");
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Siliniyor...
                </span>
              ) : (
                "Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="text-xs sm:text-sm">
            {data.length > 0 && (
              <>
                Gösterilen: {pagination.pageIndex * pagination.pageSize + 1}–
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  data.length
                )}
                / {data.length}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <ChevronLeftIcon size={16} />
            </Button>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <ChevronRightIcon size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
