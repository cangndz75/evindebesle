"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Trash2, Link as LinkIcon, Plus } from "lucide-react";

type TemplateType = "WASHING" | "DELIVERY" | "SIZENOTE";

interface Template {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  stockCode?: string;
  image?: string;
  price: number;
}

export default function AdminProductTemplatesPage() {
  const [activeTab, setActiveTab] = useState<TemplateType>("WASHING");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  // Yeni Ekleme State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Atama Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTemplates(activeTab);
  }, [activeTab]);

  // Debounced Arama
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTemplates = async (type: TemplateType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-product-templates?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      toast.error("Şablonlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle || !newContent) {
      toast.error("Başlık ve içerik gereklidir.");
      return;
    }
    try {
      const res = await fetch(`/api/admin-product-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, title: newTitle, content: newContent }),
      });
      if (res.ok) {
        toast.success("Şablon oluşturuldu!");
        setNewTitle("");
        setNewContent("");
        fetchTemplates(activeTab);
      } else {
        toast.error("Şablon oluşturulamadı");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin-product-templates?type=${activeTab}&id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Şablon silindi!");
        fetchTemplates(activeTab);
      } else {
        toast.error("Silinemedi");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const searchProducts = async (q: string) => {
    try {
      const res = await fetch(`/api/admin-products?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openAssignModal = (tpl: Template) => {
    setSelectedTemplate(tpl);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedProductIds(new Set());
    setAssignModalOpen(true);
  };

  const toggleProductSelection = (id: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProductIds(newSet);
  };

  const handleBulkAssign = async () => {
    if (!selectedTemplate || selectedProductIds.size === 0) return;
    try {
      const res = await fetch(`/api/admin-product-templates/bulk-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          templateId: selectedTemplate.id,
          productIds: Array.from(selectedProductIds),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} ürüne başarıyla atandı!`);
        setAssignModalOpen(false);
      } else {
        toast.error("Atama sırasında hata oluştu");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <div className="space-y-6 lg:p-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ürün Detay Şablonları</h1>
        <p className="text-muted-foreground mt-2">
          Ürünlerde gösterilen Yıkama Talimatı, Teslimat Bilgisi ve Beden Notlarını tek yerden yönetin ve ürünlere atayın.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TemplateType)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="WASHING">Yıkama Talimatı</TabsTrigger>
          <TabsTrigger value="DELIVERY">Teslimat & İade</TabsTrigger>
          <TabsTrigger value="SIZENOTE">Beden Notu</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Sol Kolon: Yeni Ekleme Formu */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Yeni Şablon Ekle</CardTitle>
              <CardDescription>
                {activeTab === "WASHING" && "Yıkama talimatı ekleyin"}
                {activeTab === "DELIVERY" && "Teslimat detayı ekleyin"}
                {activeTab === "SIZENOTE" && "Bedenle ilgili not ekleyin"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Başlık</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Örn: Pamuklu Yıkama" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">İçerik</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Detaylı talimat buraya..."
                  className="min-h-[150px]"
                />
              </div>
              <Button className="w-full" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" /> Ekle
              </Button>
            </CardContent>
          </Card>

          {/* Sağ Kolon: Liste */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Mevcut Şablonlar</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Yükleniyor...</p>
              ) : templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz kayıt bulunmuyor.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Başlık</TableHead>
                        <TableHead>İçerik Özeti</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((tpl) => (
                        <TableRow key={tpl.id}>
                          <TableCell className="font-medium whitespace-nowrap">{tpl.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {tpl.content}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => openAssignModal(tpl)}>
                              <LinkIcon className="w-4 h-4 mr-2" /> Toplu Ata
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(tpl.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Atama Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ürünlere Ata: {selectedTemplate?.title}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün adı veya kodu ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">Seçili Ürünler: {selectedProductIds.size}</div>
              
              {searchResults.length === 0 && searchQuery.length >= 2 ? (
                <p className="text-sm text-muted-foreground">Sonuç bulunamadı</p>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2 border rounded-md hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleProductSelection(p.id)}
                    >
                      <Checkbox checked={selectedProductIds.has(p.id)} onCheckedChange={() => toggleProductSelection(p.id)} />
                      {p.image ? (
                        <img src={p.image} className="w-10 h-10 object-cover rounded" alt={p.name} />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">Yok</div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.stockCode || "Kod yok"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleBulkAssign} disabled={selectedProductIds.size === 0}>
              Atamayı Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
