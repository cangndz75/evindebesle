"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Columns3Icon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { AddUserModal } from "@/app/(public)/_components/AddUserModal";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  subscriptionPlan: string;
  isAdmin: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const router = useRouter();
  const [data, setData] = useState<User[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Ad Soyad",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-semibold text-sm md:text-base">
          {row.getValue("name")}
        </div>
      ),
    },
    {
      header: "E-posta",
      accessorKey: "email",
    },
    {
      header: "Telefon",
      accessorKey: "phone",
    },
    {
      header: "Adres",
      accessorKey: "address",
    },
    {
      header: "Abonelik",
      accessorKey: "subscriptionPlan",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs md:text-sm">
          {row.getValue("subscriptionPlan")}
        </Badge>
      ),
    },
    {
      header: "Yetki",
      accessorKey: "isAdmin",
      cell: ({ row }) => (row.getValue("isAdmin") ? "Admin" : "Kullanıcı"),
    },
    {
      header: "Kayıt Tarihi",
      accessorKey: "createdAt",
      cell: ({ row }) =>
        new Date(row.getValue("createdAt")).toLocaleDateString("tr-TR"),
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

  const selected = table.getSelectedRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="sm:hidden flex items-center justify-between mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Geri
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="İsim veya e-posta ile filtrele"
            value={(table.getColumn("name")?.getFilterValue() as string) || ""}
            onChange={(e) =>
              table.getColumn("name")?.setFilterValue(e.target.value)
            }
            className="min-w-[240px] text-sm md:text-base"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm md:text-base">
                <Columns3Icon size={16} className="mr-2" />
                Sütunlar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {table
                .getAllColumns()
                .filter((c) => c.getCanHide())
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

        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="text-sm md:text-base">
                  <TrashIcon size={16} className="mr-2" />
                  Sil ({selected.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const selectedIds = selected.map((r) => r.original.id);
                      setData((prev) =>
                        prev.filter((u) => !selectedIds.includes(u.id))
                      );
                      table.resetRowSelection();
                    }}
                  >
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <AddUserModal
            onSuccess={() => {
              fetch("/api/users")
                .then((res) => res.json())
                .then(setData);
            }}
          />
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[700px] text-sm md:text-base">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
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
    </div>
  );
}
