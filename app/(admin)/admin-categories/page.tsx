"use client";

import { useEffect, useState, useCallback } from "react";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
import { ChevronLeftIcon, ChevronRightIcon, Edit, Trash2, Plus, Search, GripVertical, Upload, X, Image as ImageIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    products: number;
    productCategories: number;
  };
  gender?: string | null;
  group?: string | null;
  showOnHome: boolean;
  showOnMen: boolean;
  showOnWomen: boolean;
  defaultSizeGuideId?: string | null;
  defaultSizeGuide?: {
    id: string;
    title: string;
  } | null;
};

type SizeGuideOption = {
  id: string;
  title: string;
};

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-gray-100" : ""}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reordering, setReordering] = useState(false);
  const [sizeGuideOptions, setSizeGuideOptions] = useState<SizeGuideOption[]>([]);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formGender, setFormGender] = useState<string>("UNISEX");
  const [formGroup, setFormGroup] = useState<string>("Giyim");
  const [formShowOnHome, setFormShowOnHome] = useState(false);
  const [formShowOnMen, setFormShowOnMen] = useState(false);
  const [formShowOnWomen, setFormShowOnWomen] = useState(false);
  const [formDefaultSizeGuideId, setFormDefaultSizeGuideId] = useState("none");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const fetchSizeGuides = async () => {
    try {
      const res = await fetch("/api/admin/size-guides");
      if (!res.ok) throw new Error("Beden rehberleri yüklenemedi");
      const guides = await res.json();
      setSizeGuideOptions(Array.isArray(guides) ? guides : []);
    } catch (error) {
      console.error("Beden rehberleri yüklenirken hata:", error);
      setSizeGuideOptions([]);
      toast.error("Beden rehberleri yüklenirken bir hata oluştu");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSizeGuides();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir resim dosyası se?in");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resim boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Yükleme başarısız");

      const data = await res.json();
      setFormImage(data.url);
      toast.success("Resim yüklendi");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Resim yüklenirken bir hata oluştu");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormIsActive(true);
    setFormImage(null);
    setFormGender("UNISEX");
    setFormGroup("Giyim");
    setFormShowOnHome(false);
    setFormShowOnMen(false);
    setFormShowOnWomen(false);
    setFormDefaultSizeGuideId("none");
    setAddDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setFormIsActive(category.isActive);
    setFormImage(category.image || null);
    setFormGender(category.gender || "UNISEX");
    setFormGroup(category.group || "Giyim");
    setFormShowOnHome(category.showOnHome || false);
    setFormShowOnMen(category.showOnMen || false);
    setFormShowOnWomen(category.showOnWomen || false);
    setFormDefaultSizeGuideId(category.defaultSizeGuideId || "none");
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
          image: formImage || null,
          gender: formGender,
          group: formGroup,
          showOnHome: formShowOnHome,
          showOnMen: formShowOnMen,
          showOnWomen: formShowOnWomen,
          defaultSizeGuideId: formDefaultSizeGuideId === "none" ? null : formDefaultSizeGuideId,
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

  const handleToggle = async (id: string, field: "isActive" | "showOnHome" | "showOnMen" | "showOnWomen", value: boolean) => {
    try {
      const res = await fetch(`/api/admin-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) throw new Error("Güncelleme başarısız");

      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
      toast.success("Güncellendi");
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Bir hata oluştu");
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);

    const newData = arrayMove(data, oldIndex, newIndex);
    setData(newData);

    const updates = newData.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }));

    setReordering(true);
    try {
      const res = await fetch("/api/admin-categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      });

      if (!res.ok) throw new Error("Sıralama kaydedilemedi");
      toast.success("Sıralama güncellendi");
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Sıralama kaydedilemedi");
      fetchCategories();
    } finally {
      setReordering(false);
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "image",
      header: "Görsel",
      cell: ({ row }) => {
        const image = row.original.image;
        return (
          <div className="w-12 h-16 relative rounded overflow-hidden bg-gray-100">
            {image ? (
              <Image
                src={image}
                alt={row.original.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        );
      },
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
      accessorKey: "defaultSizeGuide",
      header: "Varsayılan Rehber",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.defaultSizeGuide?.title || "-"}
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
          <Switch
            checked={row.getValue("isActive")}
            onCheckedChange={(checked) =>
              handleToggle(row.original.id, "isActive", checked)
            }
          />
          <span className="text-xs font-medium">
            {row.getValue("isActive") ? "Aktif" : "Pasif"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "showOnHome",
      header: "Anasayfa",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.getValue("showOnHome")}
            onCheckedChange={(checked) =>
              handleToggle(row.original.id, "showOnHome", checked)
            }
          />
          <span className="text-xs font-medium">
            {row.getValue("showOnHome") ? "Evet" : "Hayır"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "showOnMen",
      header: "Erkek Sayfası",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.getValue("showOnMen")}
            onCheckedChange={(checked) =>
              handleToggle(row.original.id, "showOnMen", checked)
            }
          />
          <span className="text-xs font-medium">
            {row.getValue("showOnMen") ? "Evet" : "Hayır"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "showOnWomen",
      header: "Kadın Sayfası",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.getValue("showOnWomen")}
            onCheckedChange={(checked) =>
              handleToggle(row.original.id, "showOnWomen", checked)
            }
          />
          <span className="text-xs font-medium">
            {row.getValue("showOnWomen") ? "Evet" : "Hayır"}
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

  if (loading) {
    return (
      <div className="admin-page space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="admin-page space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategoriler</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sıralamaları değiştirmek için sürükleyip bırakın
          </p>
        </div>
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
        {reordering && (
          <span className="text-sm text-gray-500 animate-pulse">
            Sıralama kaydediliyor...
          </span>
        )}
      </div>

      <div className="border rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                {table.getHeaderGroups()[0]?.headers.map((header) => (
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
            </TableHeader>
            <TableBody>
              <SortableContext
                items={data.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center py-8">
                      Kategori bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((category) => (
                    <SortableRow key={category.id} id={category.id}>
                      <TableCell className="w-12 h-16">
                        <div className="w-12 h-16 relative rounded overflow-hidden bg-gray-100">
                          {category.image ? (
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">{category.slug}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{category.defaultSizeGuide?.title || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{category._count?.products || 0}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={category.isActive}
                            onCheckedChange={(checked) =>
                              handleToggle(category.id, "isActive", checked)
                            }
                          />
                          <span className="text-xs font-medium">
                            {category.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={category.showOnHome}
                            onCheckedChange={(checked) =>
                              handleToggle(category.id, "showOnHome", checked)
                            }
                          />
                          <span className="text-xs font-medium">
                            {category.showOnHome ? "Evet" : "Hayır"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={category.showOnMen}
                            onCheckedChange={(checked) =>
                              handleToggle(category.id, "showOnMen", checked)
                            }
                          />
                          <span className="text-xs font-medium">
                            {category.showOnMen ? "Evet" : "Hayır"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={category.showOnWomen}
                            onCheckedChange={(checked) =>
                              handleToggle(category.id, "showOnWomen", checked)
                            }
                          />
                          <span className="text-xs font-medium">
                            {category.showOnWomen ? "Evet" : "Hayır"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </SortableRow>
                  ))
                )}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Toplam {data.length} kategori
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-name">Kategori Adı *</Label>
              <Input
                id="add-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Kategori adı"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-description">Açıklama</Label>
              <Textarea
                id="add-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Kategori açıklaması"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Cinsiyet</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger id="gender" className="mt-1">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Erkek</SelectItem>
                    <SelectItem value="FEMALE">Kadın</SelectItem>
                    <SelectItem value="UNISEX">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="add-default-size-guide">Varsayılan Beden Rehberi</Label>
                <Select value={formDefaultSizeGuideId} onValueChange={setFormDefaultSizeGuideId}>
                  <SelectTrigger id="add-default-size-guide" className="mt-1">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seçim Yok</SelectItem>
                    {sizeGuideOptions.map((guide) => (
                      <SelectItem key={guide.id} value={guide.id}>
                        {guide.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="group">Grup</Label>
                <Select value={formGroup} onValueChange={setFormGroup}>
                  <SelectTrigger id="group" className="mt-1">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Giyim">Giyim</SelectItem>
                    <SelectItem value="Aksesuar">Aksesuar</SelectItem>
                    <SelectItem value="Koleksiyon">Koleksiyon</SelectItem>
                    <SelectItem value="Yeni">Yeni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="showOnHome"
                  checked={formShowOnHome}
                  onCheckedChange={setFormShowOnHome}
                />
                <Label htmlFor="showOnHome">Anasayfada Göster</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label htmlFor="isActive">Kategori Aktif</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="showOnMen"
                  checked={formShowOnMen}
                  onCheckedChange={setFormShowOnMen}
                />
                <Label htmlFor="showOnMen">Erkek Sayfasında Göster</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="showOnWomen"
                  checked={formShowOnWomen}
                  onCheckedChange={setFormShowOnWomen}
                />
                <Label htmlFor="showOnWomen">Kadın Sayfasında Göster</Label>
              </div>
            </div>

            <div>
              <Label>Kategori Görseli (Dikey)</Label>
              <div className="mt-2">
                {formImage ? (
                  <div className="relative w-32 h-44 rounded-lg overflow-hidden bg-gray-100 group">
                    <Image
                      src={formImage}
                      alt="Kategori g?rseli"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => setFormImage(null)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-44 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Resim Y?kle</span>
                      </>
                    )}
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-1">Önerilen oran: 3:4 (dikey)</p>
              </div>
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
            <Button onClick={handleSave} disabled={saving || uploadingImage}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kategori Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-gender">Cinsiyet</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger id="edit-gender" className="mt-1">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Erkek</SelectItem>
                    <SelectItem value="FEMALE">Kadın</SelectItem>
                    <SelectItem value="UNISEX">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-default-size-guide">Varsayılan Beden Rehberi</Label>
                <Select value={formDefaultSizeGuideId} onValueChange={setFormDefaultSizeGuideId}>
                  <SelectTrigger id="edit-default-size-guide" className="mt-1">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seçim Yok</SelectItem>
                    {sizeGuideOptions.map((guide) => (
                      <SelectItem key={guide.id} value={guide.id}>
                        {guide.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-group">Grup</Label>
                <Select value={formGroup} onValueChange={setFormGroup}>
                  <SelectTrigger id="edit-group" className="mt-1">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Giyim">Giyim</SelectItem>
                    <SelectItem value="Aksesuar">Aksesuar</SelectItem>
                    <SelectItem value="Koleksiyon">Koleksiyon</SelectItem>
                    <SelectItem value="Yeni">Yeni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-showOnHome"
                  checked={formShowOnHome}
                  onCheckedChange={setFormShowOnHome}
                />
                <Label htmlFor="edit-showOnHome">Anasayfada Göster</Label>
              </div>
            </div>

            <div>
              <Label>Kategori Görseli (Dikey)</Label>
              <div className="mt-2">
                {formImage ? (
                  <div className="relative w-32 h-44 rounded-lg overflow-hidden bg-gray-100 group">
                    <Image
                      src={formImage}
                      alt="Kategori g?rseli"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => setFormImage(null)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-44 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Resim Y?kle</span>
                      </>
                    )}
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-1">Önerilen oran: 3:4 (dikey)</p>
              </div>
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
            <Button onClick={handleSave} disabled={saving || uploadingImage}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
