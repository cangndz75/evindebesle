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
import { ChevronLeftIcon, ChevronRightIcon, Edit, Trash2, Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    products: number;
    productCategories: number;
  };
};

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-categories");
      if (!res.ok) throw new Error("Kategoriler yüklenemedi");
      const categories = await res.json();
      setData(Array.isArray(categories) ? categories : []);
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
      setData([]);
      toast.error("Kategoriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormIsActive(true);
    setAddDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setFormIsActive(category.isActive);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Kategori adı gereklidir");
      return;
    }

    setSaving(true);
    try {
      const url = editingCategory
        ? `/api/admin-categories/${editingCategory.id}`
        : "/api/admin-categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          isActive: formIsActive,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Kayıt sırasında bir hata oluştu");
      }

      toast.success(editingCategory ? "Kategori güncellendi" : "Kategori eklendi");
      setAddDialogOpen(false);
      setEditDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error("Kayıt hatası:", error);
      toast.error(error.message || "Kayıt sırasında bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin-categories/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Silme sırasında bir hata oluştu");
      }

      toast.success("Kategori silindi");
      setDeleteId(null);
      fetchCategories();
    } catch (error: any) {
      console.error("Silme hatası:", error);
      toast.error(error.message || "Silme sırasında bir hata oluştu");
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Tümünü seç"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Satırı seç"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Kategori Adı",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">{row.getValue("slug")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Açıklama",
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "_count",
      header: "Ürün Sayısı",
      cell: ({ row }) => {
        const count = row.original._count;
        return (
          <div className="text-sm">
            {count?.products || 0}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Durum",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.getValue("isActive")
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {row.getValue("isActive") ? "Aktif" : "Pasif"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(category.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      sorting,
    },
  });

  const filteredData = table.getFilteredRowModel().rows;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kategoriler</h1>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Kategori ara..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              table.getColumn("name")?.setFilterValue(e.target.value);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  Kategori bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
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
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Toplam {filteredData.length} kategori
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Sayfa {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kategori Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Kategori Adı *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Kategori adı"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Kategori açıklaması"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label htmlFor="isActive">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Kategori Adı *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Kategori adı"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Açıklama</Label>
              <Textarea
                id="edit-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Kategori açıklaması"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isActive"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label htmlFor="edit-isActive">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyi Sil</DialogTitle>
          </DialogHeader>
          <p>Bu kategoriyi silmek istediğinizden emin misiniz?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
