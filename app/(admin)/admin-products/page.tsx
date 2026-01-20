"use client";

import { useEffect, useState } from "react";
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
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { EditProductModal } from "./EditProductModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddProductModal } from "./AddProduct";
import { Badge } from "@/components/ui/badge";

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

export default function ProductsPage() {
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

  const fetchProducts = (search?: string) => {
    setLoading(true);
    const url = search ? `/api/admin-products?search=${encodeURIComponent(search)}` : "/api/admin-products";
    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ürünler yüklenirken hata:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const refresh = () => fetchProducts();

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
        <div className="font-medium min-w-[150px]">{row.getValue("name")}</div>
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
        const price = row.getValue("price") as number;
        return <div className="font-medium min-w-[100px]">{price.toFixed(2)} ₺</div>;
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
          <EditProductModal
            product={row.original}
            onSuccess={refresh}
            trigger={
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
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
            }
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={() => setDeleteId(row.original.id)}
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Input
          placeholder="Ürün adı, stok kodu veya açıklamaya göre ara..."
          value={(table.getColumn("name")?.getFilterValue() as string) || ""}
          onChange={(e) => {
            table.getColumn("name")?.setFilterValue(e.target.value);
            // API'ye arama isteği gönder
            const searchValue = e.target.value;
            if (searchValue.length >= 2 || searchValue.length === 0) {
              fetchProducts(searchValue);
            }
          }}
          className="max-w-xs flex-1 min-w-[200px]"
        />
        <div className="flex-shrink-0">
          <AddProductModal onSuccess={refresh} />
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
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
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Silme İşlemi</DialogTitle>
          </DialogHeader>
          <div>Bu ürünü silmek istediğinize emin misiniz?</div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Vazgeç
            </Button>
            <Button
              onClick={async () => {
                if (!deleteId) return;
                setDeleting(true);
                await fetch(`/api/admin-products/${deleteId}`, {
                  method: "DELETE",
                });
                setDeleting(false);
                setDeleteId(null);
                refresh();
              }}
              disabled={deleting}
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
                </span>
              ) : (
                "Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!loading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
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
            >
              <ChevronLeftIcon size={16} />
            </Button>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              size="sm"
              variant="outline"
            >
              <ChevronRightIcon size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
