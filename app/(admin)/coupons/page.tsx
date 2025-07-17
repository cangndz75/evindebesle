"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
} from "lucide-react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  PaginationState,
} from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCouponModal } from "./_components/CreateCouponModal";
import { EditCouponModal } from "./_components/EditCouponModal";
import { toast } from "sonner";

export type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "AMOUNT";
  value: number;
  usageCount: number;
  maxUsage: number | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function CouponsPage() {
  const [data, setData] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/coupons")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  };

  useEffect(fetchData, []);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kupon silindi");
      fetchData();
    } else {
      toast.error("Silme işlemi başarısız");
    }
  };

  const columns: ColumnDef<Coupon>[] = [
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
    },
    {
      header: "Kod",
      accessorKey: "code",
      cell: ({ row }) => (
        <div className="font-medium text-sm">{row.getValue("code")}</div>
      ),
    },
    {
      header: "Açıklama",
      accessorKey: "description",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      header: "Tip",
      accessorKey: "discountType",
      cell: ({ row }) =>
        row.getValue("discountType") === "PERCENT" ? "% Oran" : "₺ Tutar",
    },
    {
      header: "Değer",
      accessorKey: "value",
      cell: ({ row }) =>
        row.original.discountType === "PERCENT"
          ? `%${row.getValue("value")}`
          : `${row.getValue("value")}₺`,
    },
    {
      header: "Kullanım",
      accessorKey: "usageCount",
    },
    {
      header: "Limit",
      accessorKey: "maxUsage",
      cell: ({ row }) => row.getValue("maxUsage") ?? "Sınırsız",
    },
    {
      header: "Son Tarih",
      accessorKey: "expiresAt",
      cell: ({ row }) =>
        row.getValue("expiresAt")
          ? new Date(row.getValue("expiresAt")).toLocaleDateString("tr-TR")
          : "-",
    },
    {
      header: "Durum",
      accessorKey: "isActive",
      cell: ({ row }) =>
        row.getValue("isActive") ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Aktif
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Pasif
          </Badge>
        ),
    },
    {
      id: "actions",
      header: "İşlem",
      cell: ({ row }) => {
        const coupon = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditCoupon(coupon)}
            >
              <PencilIcon size={14} />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2Icon size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Bu kuponu silmek istediğinizden emin misiniz?
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(coupon.id)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Evet, Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, pagination, columnFilters, columnVisibility },
  });

  return (
    <div className="space-y-4 px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Kod ile filtrele"
            value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("code")?.setFilterValue(e.target.value)
            }
            className="min-w-[240px]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon size={16} className="mr-2" />
                Sütunlar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    onClick={() => column.toggleVisibility()}
                  >
                    <Checkbox checked={column.getIsVisible()} />
                    <span className="ml-2 capitalize">{column.id}</span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={() => setOpenCreate(true)} size="sm">
          <PlusIcon size={16} className="mr-2" />
          Yeni Kupon
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table className="min-w-[800px]">
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id}>
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                    Kupon bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {pagination.pageIndex * pagination.pageSize + 1}–
          {Math.min(
            (pagination.pageIndex + 1) * pagination.pageSize,
            data.length
          )}{" "}
          / {data.length} kayıt
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

      <CreateCouponModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={fetchData}
      />
      <EditCouponModal
        open={!!editCoupon}
        onOpenChange={() => setEditCoupon(null)}
        coupon={editCoupon}
        onUpdated={fetchData}
      />
    </div>
  );
}
