"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, Trash2, ArrowUp, ArrowDown, Edit, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import Image from "next/image";

type ProductBasics = {
  id: string;
  name: string;
  image?: string;
  primaryImage?: string;
  price: number;
  stockCode?: string;
  colors?: any[];
};

type Collection = {
  id: string;
  title: string;
  slug: string;
  description: string;
  image1: string;
  image2: string;
  image3: string;
  isActive: boolean;
  _count?: { products: number };
};

type CollectionProductItem = {
  id: string;
  productId: string;
  collectionId: string;
  order: number;
  product: ProductBasics;
};

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    image1: "",
    image2: "",
    image3: "",
  });

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductBasics[]>([]);
  const [collectionItems, setCollectionItems] = useState<CollectionProductItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [uploading, setUploading] = useState<Record<string, boolean>>({
    image1: false,
    image2: false,
    image3: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2 || selectedCategoryId !== "all" || selectedGender !== "all") {
        setSearching(true);
        fetchProducts(search, selectedCategoryId, selectedGender)
          .then(setSearchResults)
          .finally(() => setSearching(false));
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedCategoryId, selectedGender]);

  useEffect(() => {
    fetchCategories();
    fetchCollections();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedCollection) {
      setFormData({
        title: selectedCollection.title || "",
        slug: selectedCollection.slug || "",
        description: selectedCollection.description || "",
        image1: selectedCollection.image1 || "",
        image2: selectedCollection.image2 || "",
        image3: selectedCollection.image3 || "",
      });
      fetchCollectionItems(selectedCollection.id);
    } else {
      setFormData({ title: "", slug: "", description: "", image1: "", image2: "", image3: "" });
      setCollectionItems([]);
    }
  }, [selectedCollection]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-collections`);
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      } else {
        setCollections([]);
      }
    } catch (e) {
      toast.error("Koleksiyonlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (q: string, catId: string, gen: string) => {
    try {
      let url = `/api/admin-products?limit=20`;
      if (q) url += `&search=${encodeURIComponent(q)}`;
      if (catId !== "all") url += `&categoryId=${catId}`;
      if (gen !== "all") url += `&gender=${gen.toUpperCase()}`;
      
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const fetchCollectionItems = async (collectionId: string) => {
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/admin-collection-products?collectionId=${collectionId}`);
      if (res.ok) {
        const data = await res.json();
        setCollectionItems(data);
      } else {
        setCollectionItems([]);
      }
    } catch (e) {
      toast.error("Ürünler yüklenemedi");
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCreateOrUpdateCollection = async () => {
    const url = "/api/admin-collections";
    const method = selectedCollection ? "PUT" : "POST";
    const body = selectedCollection ? { ...formData, id: selectedCollection.id } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(selectedCollection ? "Koleksiyon güncellendi!" : "Koleksiyon oluşturuldu!");
        fetchCollections();
        setIsCreating(false);
        if (!selectedCollection) {
          const newData = await res.json();
          setSelectedCollection(newData);
        }
      } else {
         const err = await res.json();
         toast.error(err.error || "Hata oluştu");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Koleksiyonu silmek istediğinize emin misiniz? (İçindeki ürün bağlantıları da silinecektir)")) return;
    try {
      const res = await fetch(`/api/admin-collections?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Koleksiyon silindi!");
        if (selectedCollection?.id === id) setSelectedCollection(null);
        fetchCollections();
      } else {
        toast.error("Silinemedi");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleAddProduct = async (product: ProductBasics) => {
    if (!selectedCollection) return;
    try {
      const res = await fetch("/api/admin-collection-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, collectionId: selectedCollection.id }),
      });

      if (res.ok) {
        toast.success("Koleksiyona eklendi!");
        fetchCollectionItems(selectedCollection.id);
        fetchCollections(); // Count güncellemesi için
      } else {
        const err = await res.json();
        toast.error(err.error || "Hata oluştu");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!selectedCollection) return;
    try {
      const res = await fetch(`/api/admin-collection-products?productId=${productId}&collectionId=${selectedCollection.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Koleksiyondan çıkarıldı!");
        fetchCollectionItems(selectedCollection.id);
        fetchCollections();
      } else {
        toast.error("Silinemedi");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === collectionItems.length - 1) return;
    if (!selectedCollection) return;

    const newItems = [...collectionItems];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newItems[index].order;
    newItems[index].order = newItems[swapIndex].order;
    newItems[swapIndex].order = tempOrder;

    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setCollectionItems([...newItems]);

    try {
      const reorderPayload = newItems.map(item => ({ id: item.id, order: item.order }));
      const res = await fetch("/api/admin-collection-products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reorderPayload, collectionId: selectedCollection.id })
      });

      if (!res.ok) {
        toast.error("Sıralama güncellenemedi");
        fetchCollectionItems(selectedCollection.id);
      } else {
        toast.success("Sıralama güncellendi");
      }
    } catch (e) {
      toast.error("Sıralama yüklenirken hata oluştu");
    }
  };

  const getProductImage = (p: ProductBasics) => {
    if (p.primaryImage) return p.primaryImage;
    if (p.image) return p.image;
    if (p.colors && p.colors[0]?.images) {
      try {
         const parsed = typeof p.colors[0].images === 'string' ? JSON.parse(p.colors[0].images) : p.colors[0].images;
         if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return "https://via.placeholder.com/50";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "image1" | "image2" | "image3") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const url = await uploadFileToCloudinary(file);
      if (url) {
        setFormData(prev => ({ ...prev, [field]: url }));
        toast.success("Görsel yüklendi!");
      } else {
        toast.error("Görsel yüklenemedi");
      }
    } catch (error) {
      toast.error("Yükleme sırasında hata oluştu");
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  return (
    <div className="space-y-6 lg:p-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Koleksiyonlar Yönetimi</h1>
        <p className="text-muted-foreground mt-2">
          Görselli özel koleksiyon sayfaları ("Poliform Collection" gibi) oluşturun ve ürün atayın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Sütun: Koleksiyonlar Listesi */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                 <CardTitle>Mevcut Koleksiyonlar</CardTitle>
              </div>
              <Button size="sm" onClick={() => { setIsCreating(true); setSelectedCollection(null); }}>
                <Plus className="w-4 h-4 mr-1" /> Yeni Oluştur
              </Button>
            </CardHeader>
            <CardContent>
               {loading ? (
                  <div className="text-center py-4 text-sm text-gray-500">Yükleniyor...</div>
               ) : collections.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">Hiç koleksiyon bulunamadı.</div>
               ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                     {collections.map(c => (
                        <div 
                           key={c.id} 
                           className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedCollection?.id === c.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                           onClick={() => setSelectedCollection(c)}   
                        >
                           <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-sm">{c.title}</h3>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDeleteCollection(c.id); }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                           </div>
                           <p className="text-xs text-muted-foreground truncate">/{c.slug}</p>
                           <div className="mt-2 text-xs font-medium text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded">
                              {c._count?.products || 0} Ürün
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ Sütun: Form & Ürünler */}
        <div className="lg:col-span-2 space-y-6">
           {(selectedCollection || isCreating) ? (
              <>
                 <Card>
                    <CardHeader>
                       <CardTitle>{isCreating && !selectedCollection ? "Yeni Koleksiyon Oluştur" : "Koleksiyon Detayları"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-sm font-medium">Başlık</label>
                             <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Örn: Poliform Collection" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-sm font-medium">Bağlantı URL (Slug)</label>
                             <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Örn: poliform-collection" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Açıklama</label>
                          <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Koleksiyon detayları..." rows={3} />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Görsel 1 */}
                          <div className="space-y-2">
                             <label className="text-sm font-medium">Ana Görsel (Dikdörtgen)</label>
                             <div className="space-y-2">
                                {formData.image1 && (
                                   <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-gray-50">
                                      <Image src={formData.image1} alt="Preview 1" fill className="object-cover" />
                                   </div>
                                )}
                                <div className="flex gap-2">
                                   <Input 
                                      value={formData.image1} 
                                      onChange={e => setFormData({...formData, image1: e.target.value})} 
                                      placeholder="URL veya dosya seçin..." 
                                      className="flex-1"
                                   />
                                   <div className="relative">
                                      <input
                                         type="file"
                                         id="upload-image1"
                                         className="hidden"
                                         accept="image/*"
                                         onChange={(e) => handleFileUpload(e, "image1")}
                                      />
                                      <Button 
                                         variant="outline" 
                                         size="sm"
                                         disabled={uploading.image1}
                                         onClick={() => document.getElementById("upload-image1")?.click()}
                                      >
                                         {uploading.image1 ? "..." : "Yükle"}
                                      </Button>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Görsel 2 */}
                          <div className="space-y-2">
                             <label className="text-sm font-medium">İkincil Görsel 1 (Kare)</label>
                             <div className="space-y-2">
                                {formData.image2 && (
                                   <div className="relative aspect-square w-full overflow-hidden rounded-md border bg-gray-50">
                                      <Image src={formData.image2} alt="Preview 2" fill className="object-cover" />
                                   </div>
                                )}
                                <div className="flex gap-2">
                                   <Input 
                                      value={formData.image2} 
                                      onChange={e => setFormData({...formData, image2: e.target.value})} 
                                      placeholder="URL veya dosya seçin..." 
                                      className="flex-1"
                                   />
                                   <div className="relative">
                                      <input
                                         type="file"
                                         id="upload-image2"
                                         className="hidden"
                                         accept="image/*"
                                         onChange={(e) => handleFileUpload(e, "image2")}
                                      />
                                      <Button 
                                         variant="outline" 
                                         size="sm"
                                         disabled={uploading.image2}
                                         onClick={() => document.getElementById("upload-image2")?.click()}
                                      >
                                         {uploading.image2 ? "..." : "Yükle"}
                                      </Button>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Görsel 3 */}
                          <div className="space-y-2">
                             <label className="text-sm font-medium">İkincil Görsel 2 (Kare)</label>
                             <div className="space-y-2">
                                {formData.image3 && (
                                   <div className="relative aspect-square w-full overflow-hidden rounded-md border bg-gray-50">
                                      <Image src={formData.image3} alt="Preview 3" fill className="object-cover" />
                                   </div>
                                )}
                                <div className="flex gap-2">
                                   <Input 
                                      value={formData.image3} 
                                      onChange={e => setFormData({...formData, image3: e.target.value})} 
                                      placeholder="URL veya dosya seçin..." 
                                      className="flex-1"
                                   />
                                   <div className="relative">
                                      <input
                                         type="file"
                                         id="upload-image3"
                                         className="hidden"
                                         accept="image/*"
                                         onChange={(e) => handleFileUpload(e, "image3")}
                                      />
                                      <Button 
                                         variant="outline" 
                                         size="sm"
                                         disabled={uploading.image3}
                                         onClick={() => document.getElementById("upload-image3")?.click()}
                                      >
                                         {uploading.image3 ? "..." : "Yükle"}
                                      </Button>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                       <Button onClick={handleCreateOrUpdateCollection} className="w-full mt-4">KAYDET</Button>
                    </CardContent>
                 </Card>

                 {selectedCollection && (
                    <Card>
                       <CardHeader>
                          <CardTitle>Koleksiyondaki Ürünler</CardTitle>
                       </CardHeader>
                       <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-4">
                                <div className="space-y-3">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Ürün ara..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <Select value={selectedGender} onValueChange={setSelectedGender}>
                                      <SelectTrigger className="text-[10px] h-8">
                                        <SelectValue placeholder="Cinsiyet" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">Tüm Cins.</SelectItem>
                                        <SelectItem value="male">Erkek</SelectItem>
                                        <SelectItem value="female">Kadın</SelectItem>
                                        <SelectItem value="unisex">Unisex</SelectItem>
                                      </SelectContent>
                                    </Select>

                                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                      <SelectTrigger className="text-[10px] h-8">
                                        <SelectValue placeholder="Kategori" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">Tüm Kat.</SelectItem>
                                        {categories.map((cat) => (
                                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {(search.length >= 2 || selectedCategoryId !== "all" || selectedGender !== "all") && searchResults.length === 0 && !searching && (
                                  <div className="text-center py-4 text-[11px] text-gray-400 italic">Sonuç yok</div>
                                )}

                                {searching && (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto"></div>
                                  </div>
                                )}

                                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                  {searchResults.map((product) => {
                                    const isAdded = collectionItems.some(item => item.productId === product.id);
                                    return (
                                      <div key={product.id} className={`flex items-center justify-between p-2 border rounded-lg transition-all ${isAdded ? 'bg-green-50/50 border-green-100 opacity-80' : 'hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          <img src={getProductImage(product)} alt={product.name} className="w-8 h-8 object-cover rounded shadow-sm border" />
                                          <div className="overflow-hidden">
                                            <p className="font-medium text-[11px] truncate">{product.name}</p>
                                            <p className="text-[9px] text-muted-foreground">{product.stockCode}</p>
                                          </div>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant={isAdded ? "ghost" : "outline"} 
                                          className="h-7 px-2" 
                                          onClick={() => handleAddProduct(product)} 
                                          disabled={isAdded}
                                        >
                                          {isAdded ? (
                                            <Check className="w-3 h-3 text-green-600" />
                                          ) : (
                                            <Plus className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                             <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                   <TableHeader>
                                      <TableRow>
                                         <TableHead className="w-12">Sıra</TableHead>
                                         <TableHead>Ürün</TableHead>
                                         <TableHead className="text-right w-12"></TableHead>
                                      </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                      {collectionItems.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-4 text-xs text-gray-500">Ürün yok.</TableCell></TableRow>
                                      ) : collectionItems.map((item, idx) => (
                                        <TableRow key={item.id}>
                                           <TableCell className="p-2">
                                              <div className="flex flex-col items-center justify-center space-y-1 bg-gray-50 px-1 py-0.5 rounded-md">
                                                 <button onClick={() => handleMoveItem(idx, 'up')} disabled={idx === 0} className="hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp className="w-3 h-3 text-gray-600" /></button>
                                                 <button onClick={() => handleMoveItem(idx, 'down')} disabled={idx === collectionItems.length - 1} className="hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown className="w-3 h-3 text-gray-600" /></button>
                                              </div>
                                           </TableCell>
                                           <TableCell className="p-2">
                                              <div className="flex items-center gap-2">
                                                <img src={getProductImage(item.product)} className="w-8 h-8 object-cover rounded" />
                                                <span className="text-xs font-medium">{item.product.name}</span>
                                              </div>
                                           </TableCell>
                                           <TableCell className="p-2 text-right">
                                              <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => handleRemoveProduct(item.product.id)}>
                                                 <Trash2 className="h-3 w-3" />
                                              </Button>
                                           </TableCell>
                                        </TableRow>
                                      ))}
                                   </TableBody>
                                </Table>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 )}
              </>
           ) : (
              <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-gray-50 text-gray-400">
                 Koleksiyon ayrıntılarını görmek veya oluşturmak için soldan işlem yapın.
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
