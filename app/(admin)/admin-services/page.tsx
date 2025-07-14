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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "lucide-react";
import { AddServiceModal } from "@/app/(public)/_components/admin/services/AddServiceModal";
import { EditServiceModal } from "@/app/(public)/_components/admin/services/EditServiceModal";

type Service = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  image?: string;
  createdAt: string;
};

export default function ServicesPage() {
  const [data, setData] = useState<Service[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const refresh = () => {
    fetch("/api/admin-services")
      .then((res) => res.json())
      .then(setData);
  };

  useEffect(refresh, []);

  const handleToggleActive = async (id: string, val: boolean) => {
    await fetch(`/api/admin-services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: val }),
    });
    refresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin-services/${id}`, { method: "DELETE" });
    refresh();
  };

  const columns: ColumnDef<Service>[] = [
    {
      header: "Ad",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      header: "Açıklama",
      accessorKey: "description",
    },
    {
      header: "Fiyat (₺)",
      accessorKey: "price",
    },
    {
      header: "Aktif",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <Switch
          checked={row.getValue("isActive")}
          onCheckedChange={(val) => handleToggleActive(row.original.id, val)}
        />
      ),
    },
    {
      header: "Tarih",
      accessorKey: "createdAt",
      cell: ({ row }) =>
        new Date(row.getValue("createdAt")).toLocaleDateString("tr-TR"),
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <>
          <EditServiceModal service={row.original} onSuccess={refresh} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
          >
            <TrashIcon size={16} />
          </Button>
        </>
      ),
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
      <div className="flex items-center justify-between">
        <Input
          placeholder="Hizmet adına göre filtrele"
          value={(table.getColumn("name")?.getFilterValue() as string) || ""}
          onChange={(e) =>
            table.getColumn("name")?.setFilterValue(e.target.value)
          }
          className="max-w-xs"
        />
        <AddServiceModal onSuccess={refresh} />
      </div>

      <div className="rounded-md border">
        <Table>
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
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {data.length > 0 && (
            <>
              Gösterilen: {pagination.pageIndex * pagination.pageSize + 1}–
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                data.length
              )}{" "}
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
    </div>
  );
}
