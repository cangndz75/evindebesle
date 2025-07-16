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
import { AdminEditPetModal } from "./AdminEditPetModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddPetModal } from "./AddPet";

type Pet = {
  id: string;
  name: string;
  createdAt: string;
  image?: string;
};

export default function PetsPage() {
  const [data, setData] = useState<Pet[]>([]);
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

  const fetchPets = () => {
    setLoading(true);
    fetch("/api/pets")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const refresh = () => fetchPets();

  const columns: ColumnDef<Pet>[] = [
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
          <img src={url} alt="Pet" className="w-10 h-10 object-cover rounded" />
        ) : (
          <div className="w-10 h-10 bg-muted flex items-center justify-center text-xs text-muted-foreground rounded">
            Yok
          </div>
        );
      },
    },
    {
      header: "Adı",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AdminEditPetModal
            pet={row.original}
            onSuccess={refresh}
            trigger={
              <Button size="icon" variant="ghost" className="hover:bg-muted">
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
            size="icon"
            variant="ghost"
            className="hover:bg-muted"
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
          placeholder="Pet adına göre filtrele"
          value={(table.getColumn("name")?.getFilterValue() as string) || ""}
          onChange={(e) =>
            table.getColumn("name")?.setFilterValue(e.target.value)
          }
          className="max-w-xs"
        />
        <AddPetModal onSuccess={refresh} />
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
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Silme İşlemi</DialogTitle>
          </DialogHeader>
          <div>Bu evcil hayvanı silmek istediğinize emin misiniz?</div>
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
                await fetch(`/api/admin-pets/${deleteId}`, {
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
