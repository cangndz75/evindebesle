"use client"

import { useEffect, useState } from "react"
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
} from "@tanstack/react-table"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EllipsisIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { AddPetModal } from "@/app/(public)/_components/AddPet"
import { EditPetModal } from "@/app/(public)/_components/EditPetModal"

type Pet = {
  id: string
  name: string
  createdAt: string
  image?: string
}

export default function PetsPage() {
  const [data, setData] = useState<Pet[]>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => {
    fetch("/api/pets").then(res => res.json()).then(setData)
  }, [])

  const refresh = () => {
    fetch("/api/pets").then(res => res.json()).then(setData)
  }

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
        const url = row.original.image
        return url ? (
          <img src={url} alt="Pet image" className="w-10 h-10 object-cover rounded" />
        ) : (
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">Yok</div>
        )
      },
    },
    {
      header: "Adı",
      accessorKey: "name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      header: "Oluşturulma",
      accessorKey: "createdAt",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString("tr-TR"),
    },
    // {
    //   id: "actions",
    //   header: () => null,
    //   cell: ({ row }) => (
    //     <DropdownMenu>
    //       <DropdownMenuTrigger asChild>
    //         <Button variant="ghost" className="w-full text-left">
    //           <EllipsisIcon size={16} />
    //         </Button>
    //       </DropdownMenuTrigger>
    //       <DropdownMenuContent align="end">
    //         <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
    //         <EditPetModal pet={row.original} onSuccess={refresh} />
    //         <DropdownMenuItem onClick={async () => {
    //           await fetch(`/api/pets/${row.original.id}`, { method: "DELETE" })
    //           refresh()
    //         }}>
    //           Sil
    //         </DropdownMenuItem>
    //       </DropdownMenuContent>
    //     </DropdownMenu>
    //   ),
    // },
  ]

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
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Pet adına göre filtrele"
          value={table.getColumn("name")?.getFilterValue() as string || ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
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
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
            <>Gösterilen: {pagination.pageIndex * pagination.pageSize + 1}–{Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.length)} / {data.length}</>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} size="sm" variant="outline">
            <ChevronLeftIcon size={16} />
          </Button>
          <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} size="sm" variant="outline">
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
