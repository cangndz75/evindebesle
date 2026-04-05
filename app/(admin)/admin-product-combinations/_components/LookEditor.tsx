"use client";
 
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Plus, Trash2, ArrowRight, ArrowLeft, Check, Layout, Settings, Eye, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
 
type ProductBasics = {
  id: string;
  name: string;
  stockCode: string;
  price: number;
  image?: string;
  primaryImage?: string;
};
 
interface LookEditorProps {
  initialData?: any;
}
 
export default function LookEditor({ initialData }: LookEditorProps) {
  const router = useRouter();
  const ITEMS_PER_PAGE = 20;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<ProductBasics[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const categoryScrollRefStep1 = useRef<HTMLDivElement | null>(null);
  const categoryScrollRefStep2 = useRef<HTMLDivElement | null>(null);
 
  const [mainProduct, setMainProduct] = useState<ProductBasics | null>(null);
  const [lookItems, setLookItems] = useState<ProductBasics[]>([]);
  const [config, setConfig] = useState({
    title: "Takımı Tamamla",
    priority: "0",
    isVisible: true,
    showAllAddButton: true,
    showTotalPrice: true,
    showDiscountBadge: false,
    status: "DRAFT"
  });
 
  useEffect(() => {
    fetchCategories();
    if (initialData) {
      setMainProduct(initialData.mainProduct);
      setLookItems(initialData.items.map((i: any) => i.product));
      setConfig({
        title: initialData.title || "Takımı Tamamla",
        priority: initialData.priority?.toString() || "0",
        isVisible: initialData.isVisible ?? true,
        showAllAddButton: initialData.showAllAddButton ?? true,
        showTotalPrice: initialData.showTotalPrice ?? true,
        showDiscountBadge: initialData.showDiscountBadge ?? false,
        status: initialData.status || "DRAFT"
      });
      setStep(2); // Start at step 2 if editing
    }
  }, [initialData]);
 
  const fetchCategories = async () => {
    const res = await fetch("/api/admin-categories");
    const data = await res.json();
    setCategories(data);
  };
 
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step !== 3) {
        performSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, selectedCategoryId, step]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategoryId, step]);
 
  const performSearch = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategoryId !== "all") params.append("categoryId", selectedCategoryId);
      
      const res = await fetch(`/api/admin-products?${params.toString()}`);
      const data = await res.json();
      const products = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : []);

      setSearchResults(
        products.filter((p: ProductBasics) => {
          if (step === 2 && mainProduct) return p.id !== mainProduct.id;
          return true;
        })
      );
    } finally {
      setSearching(false);
    }
  };
 
  const handleSelectMainProduct = (p: ProductBasics) => {
    setMainProduct(p);
    setStep(2);
  };
 
  const handleToggleItem = (p: ProductBasics) => {
    if (lookItems.some(i => i.id === p.id)) {
      setLookItems(lookItems.filter(i => i.id !== p.id));
    } else {
      setLookItems([...lookItems, p]);
    }
  };
 
  const handleRemoveItem = (id: string) => {
    setLookItems(lookItems.filter(i => i.id !== id));
  };
 
  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...lookItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setLookItems(newItems);
  };
 
  const moveItemDown = (index: number) => {
    if (index === lookItems.length - 1) return;
    const newItems = [...lookItems];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setLookItems(newItems);
  };
 
  const handleSave = async (published = false) => {
    if (!mainProduct) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin-look-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainProductId: mainProduct.id,
          ...config,
          status: published ? "PUBLISHED" : "DRAFT",
          items: lookItems.map(i => ({ productId: i.id }))
        })
      });
 
      if (res.ok) {
        toast.success(published ? "Kombinasyon yayına alındı!" : "Taslak olarak kaydedildi.");
        router.push("/admin-product-combinations");
      } else {
        const data = await res.json();
        toast.error(data.error || "Kaydedilemedi.");
      }
    } catch (e) {
      toast.error("Bir hata oluştu.");
    } finally { setLoading(false); }
  };
 
  const getProductImage = (p: ProductBasics) => {
    return p.primaryImage || p.image || "https://via.placeholder.com/150";
  };

  const handleCategoryScroll = (target: "step1" | "step2", direction: "left" | "right") => {
    const ref = target === "step1" ? categoryScrollRefStep1.current : categoryScrollRefStep2.current;
    if (!ref) return;
    const amount = 260;
    ref.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  const totalPages = Math.max(1, Math.ceil(searchResults.length / ITEMS_PER_PAGE));
  const paginatedResults = searchResults.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
 
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-black rounded-2xl">
            <Layout className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{initialData ? "Kombinasyonu Düzenle" : "Yeni Ürün Kombinasyonu"}</h1>
            <p className="text-gray-500 mt-1">Stil önerileri ve "Takımı Tamamla" bölümlerini yönetin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-full px-6 h-12" onClick={() => router.push("/admin-product-combinations")}>
             İptal
           </Button>
           <Button className="rounded-full px-8 h-12 bg-black hover:bg-black/90" onClick={() => handleSave(false)} disabled={loading || !mainProduct}>
              Taslak Kaydet
           </Button>
        </div>
      </div>
 
      
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-4">
               <div 
                 className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step >= s ? 'bg-black text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400'}`}
               >
                 {step > s ? <Check className="w-5 h-5" /> : s}
               </div>
               {s < 3 && <div className={`w-12 h-0.5 rounded-full transition-all duration-500 ${step > s ? 'bg-black' : 'bg-gray-100'}`}></div>}
            </div>
          ))}
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           
           {step === 1 && (
             <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden">
                <CardHeader className="bg-gray-50/50 p-8 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <Plus className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Ana Ürünü Seçin</CardTitle>
                      <CardDescription>Kombinasyonun hangi ürün detay sayfasında görüneceğini belirleyin</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6 text-center">
                  <div className="relative group mx-auto max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                    <Input 
                      placeholder="Ürün adı veya stok kodu ile ara..." 
                      className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl text-lg focus:ring-black focus:border-black"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
 
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-full shrink-0"
                      onClick={() => handleCategoryScroll("step1", "left")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div ref={categoryScrollRefStep1} className="w-full flex gap-2 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <Button variant={selectedCategoryId === 'all' ? 'default' : 'outline'} size="sm" className="rounded-full px-6 h-10 font-bold shrink-0" onClick={() => setSelectedCategoryId('all')}>Tümü</Button>
                        {categories.map(cat => (
                          <Button key={cat.id} variant={selectedCategoryId === cat.id ? 'default' : 'outline'} size="sm" className="rounded-full px-6 h-10 font-bold shrink-0" onClick={() => setSelectedCategoryId(cat.id)}>{cat.name}</Button>
                        ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-full shrink-0"
                      onClick={() => handleCategoryScroll("step1", "right")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
 
                  {searching && <div className="text-center py-20 animate-pulse text-gray-300 font-black tracking-widest uppercase">Aranıyor...</div>}
 
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedResults.map(p => (
                      <div 
                        key={p.id} 
                        className={`group relative bg-white border rounded-3xl p-4 transition-all duration-500 hover:shadow-2xl cursor-pointer overflow-hidden ${mainProduct?.id === p.id ? 'border-black ring-1 ring-black shadow-xl ring-offset-4' : 'border-gray-100 hover:border-black/20'}`}
                        onClick={() => handleSelectMainProduct(p)}
                      >
                         <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4">
                            <img src={getProductImage(p)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         </div>
                         <p className="font-bold text-sm text-left truncate">{p.name}</p>
                         <p className="text-xs text-gray-400 text-left mt-1">{p.stockCode}</p>
                      </div>
                    ))}
                  </div>

                  {searchResults.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <p className="text-sm text-gray-500 font-medium">Toplam {searchResults.length} urun • Sayfa {currentPage}/{totalPages}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-5"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Onceki
                        </Button>
                        <Button
                          type="button"
                          className="rounded-full px-5 bg-black hover:bg-black/90"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
             </Card>
           )}
 
           
           {step === 2 && (
             <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden">
                <CardHeader className="bg-gray-50/50 p-8 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <Plus className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Tamamlayıcı Ürünler Ekle</CardTitle>
                      <CardDescription>Bu kombinasyonda birlikte önerilecek ürünleri seçin</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="relative group">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-black transition-colors" />
                     <Input 
                       placeholder="Tamamlayıcı ürün ara..." 
                       className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl text-lg focus:ring-black focus:border-black"
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                     />
                   </div>
 
                   <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full shrink-0"
                        onClick={() => handleCategoryScroll("step2", "left")}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div ref={categoryScrollRefStep2} className="w-full flex gap-2 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <Button variant={selectedCategoryId === 'all' ? 'default' : 'outline'} size="sm" className="rounded-full px-6 h-10 font-bold shrink-0" onClick={() => setSelectedCategoryId('all')}>Tümü</Button>
                        {categories.map(cat => (
                          <Button key={cat.id} variant={selectedCategoryId === cat.id ? 'default' : 'outline'} size="sm" className="rounded-full px-6 h-10 font-bold shrink-0" onClick={() => setSelectedCategoryId(cat.id)}>{cat.name}</Button>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full shrink-0"
                        onClick={() => handleCategoryScroll("step2", "right")}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                   </div>
 
                   {searching && <div className="text-center py-20 animate-pulse text-gray-300 font-black tracking-widest uppercase">Aranıyor...</div>}
 
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {paginatedResults.map(p => (
                      <div 
                        key={p.id} 
                        className={`group relative bg-white border rounded-3xl p-4 transition-all duration-500 hover:shadow-2xl cursor-pointer overflow-hidden ${lookItems.some(i => i.id === p.id) ? 'border-black ring-1 ring-black bg-gray-50/50' : 'border-gray-100'}`}
                        onClick={() => handleToggleItem(p)}
                      >
                         <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4">
                            <img src={getProductImage(p)} className="w-full h-full object-cover" />
                            {lookItems.some(i => i.id === p.id) && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                <Check className="w-12 h-12 text-white" />
                              </div>
                            )}
                         </div>
                         <p className="font-bold text-sm truncate">{p.name}</p>
                         <p className="text-xs text-black mt-1 font-black">{p.price} TL</p>
                      </div>
                    ))}
                  </div>

                  {searchResults.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <p className="text-sm text-gray-500 font-medium">Toplam {searchResults.length} urun • Sayfa {currentPage}/{totalPages}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-5"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Onceki
                        </Button>
                        <Button
                          type="button"
                          className="rounded-full px-5 bg-black hover:bg-black/90"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
             </Card>
           )}
 
           
           {step === 3 && (
             <div className="space-y-10">
               <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden">
                 <CardHeader className="bg-gray-50/50 p-8 border-b border-gray-100">
                   <div className="flex items-center gap-4">
                     <Settings className="h-8 w-8 text-black" />
                     <CardTitle className="text-2xl">Görüntüleme Ayarları</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-4">
                         <Label className="text-black font-black uppercase tracking-widest text-xs">Bölüm Başlığı</Label>
                         <Input 
                           placeholder="Örn: Takımı Tamamla" 
                           className="h-14 bg-gray-50 border-gray-100 rounded-2xl px-6"
                           value={config.title}
                           onChange={(e) => setConfig({...config, title: e.target.value})}
                         />
                       </div>
                       <div className="space-y-4">
                         <Label className="text-black font-black uppercase tracking-widest text-xs">Öncelik</Label>
                         <Select 
                           value={config.priority}
                           onValueChange={(v) => setConfig({...config, priority: v})}
                         >
                           <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl px-6">
                             <SelectValue placeholder="Seçiniz" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-gray-100">
                             <SelectItem value="0">Normal - Alt kısımlarda göster</SelectItem>
                             <SelectItem value="10">Yüksek - Üst kısımlarda göster</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex items-center space-x-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                         <Checkbox id="isVisible" checked={config.isVisible} onCheckedChange={(v) => setConfig({...config, isVisible: !!v})} className="w-6 h-6 rounded-lg" />
                         <Label htmlFor="isVisible" className="font-bold cursor-pointer">Ürün sayfasında göster</Label>
                       </div>
                       <div className="flex items-center space-x-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                         <Checkbox id="showTotalPrice" checked={config.showTotalPrice} onCheckedChange={(v) => setConfig({...config, showTotalPrice: !!v})} className="w-6 h-6 rounded-lg" />
                         <Label htmlFor="showTotalPrice" className="font-bold cursor-pointer">Toplam değer göster</Label>
                       </div>
                       <div className="flex items-center space-x-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                         <Checkbox id="showAllAddButton" checked={config.showAllAddButton} onCheckedChange={(v) => setConfig({...config, showAllAddButton: !!v})} className="w-6 h-6 rounded-lg" />
                         <Label htmlFor="showAllAddButton" className="font-bold cursor-pointer">Hepsini ekle butonu</Label>
                       </div>
                       <div className="flex items-center space-x-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                         <Checkbox id="showDiscountBadge" checked={config.showDiscountBadge} onCheckedChange={(v) => setConfig({...config, showDiscountBadge: !!v})} className="w-6 h-6 rounded-lg" />
                         <Label htmlFor="showDiscountBadge" className="font-bold cursor-pointer">İndirim rozeti göster</Label>
                       </div>
                    </div>
                 </CardContent>
               </Card>
 
               <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-black text-white">
                 <CardHeader className="p-8 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <Eye className="h-8 w-8 text-white" />
                      <CardTitle className="text-2xl text-white">Mağaza Ön Görünümü</CardTitle>
                    </div>
                 </CardHeader>
                 <CardContent className="p-8 pt-4">
                   <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl p-10 text-center min-h-[300px] flex flex-col justify-center items-center text-black">
                       {!config.isVisible && <div className="mb-4 bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100">Şu an gizli (Ürün sayfasında görünmez)</div>}
                       <h3 className="text-4xl font-light mb-4">{config.title || "Takımı Tamamla"}</h3>
                       <p className="text-sm text-gray-400 font-light italic mb-10">Bu parçayı seçtiğimiz tamamlayıcı ürünlerle stilize edin ve görünümünüzü tamamlayın</p>
                       
                       <div className="flex flex-wrap justify-center gap-6">
                         {lookItems.map(item => (
                           <div key={item.id} className="w-32 relative">
                              {config.showDiscountBadge && <div className="absolute top-2 left-2 bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full z-10 font-bold uppercase tracking-tighter">%15</div>}
                              <img src={getProductImage(item)} className="w-32 h-44 object-cover rounded-2xl shadow-lg ring-1 ring-black/5" />
                              <p className="mt-2 text-[11px] font-bold truncate">{item.name}</p>
                              {config.showTotalPrice && <p className="text-[10px] font-medium text-gray-400">{item.price} TL</p>}
                           </div>
                         ))}
                       </div>
 
                       {config.showAllAddButton && (
                         <div className="mt-10">
                           <Button variant="outline" className="rounded-full px-8 h-12 border-black text-black font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-black hover:text-white transition-all">Hepsini Sepete Ekle</Button>
                         </div>
                       )}
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
        </div>
 
        <div className="lg:col-span-4 space-y-6">
           <Card className="border-none shadow-2xl rounded-[40px] sticky top-32 overflow-hidden bg-white/80 backdrop-blur-xl">
             <CardHeader className="p-8 border-b border-gray-100 bg-gray-50/30">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Sizin Seçiminiz</span>
                  {lookItems.length > 0 && <Badge className="bg-black text-white hover:bg-black rounded-full px-4">{lookItems.length}</Badge>}
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8">
                {mainProduct ? (
                  <div className="space-y-8">
                     <div className="bg-white p-6 rounded-3xl border border-black shadow-xl ring-1 ring-black/5">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest flex items-center gap-2">
                           <Check className="w-3 h-3 text-green-500" /> Ana Ürün
                        </p>
                        <div className="flex items-center gap-4">
                          <img src={getProductImage(mainProduct)} className="w-20 h-28 object-cover rounded-2xl shadow-md" />
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-sm truncate">{mainProduct.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{mainProduct.stockCode}</p>
                            <p className="text-[14px] font-black text-gray-900 mt-2">{mainProduct.price} TL</p>
                            <button onClick={() => { setMainProduct(null); setStep(1); }} className="text-[10px] text-red-500 font-bold mt-2 hover:underline">Değiştir</button>
                          </div>
                        </div>
                     </div>
 
                     <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 pb-2">Tamamlayıcı Ürünler</h5>
                        {lookItems.length === 0 ? (
                           <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                              <p className="text-xs text-gray-300 italic">Henüz ürün seçilmedi</p>
                           </div>
                        ) : (
                           <div className="space-y-3">
                              {lookItems.map((item, idx) => (
                                <div key={item.id} className="group flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-black/20 hover:bg-white transition-all">
                                  <img src={getProductImage(item)} className="w-14 h-20 object-cover rounded-xl shadow-sm" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[11px] truncate">{item.name}</h4>
                                    <div className="flex items-center justify-between">
                                      <p className="text-[14px] font-black text-gray-900 mt-1">{item.price} TL</p>
                                    </div>
                                  </div>
                                   <div className="flex flex-col items-end gap-2">
                                      <div className="flex gap-1 mb-1">
                                        <button onClick={() => moveItemUp(idx)} className="text-gray-300 hover:text-black transition-colors disabled:opacity-30" disabled={idx === 0}>
                                          <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => moveItemDown(idx)} className="text-gray-300 hover:text-black transition-colors disabled:opacity-30" disabled={idx === lookItems.length - 1}>
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                   </div>
                                </div>
                              ))}
                           </div>
                        )}
                        <div className="bg-yellow-50 p-4 rounded-2xl flex items-start gap-3 mt-4 border border-yellow-100">
                           <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
                           <p className="text-[11px] font-bold text-yellow-800 leading-relaxed italic">
                              Ok tuşlarıyla ürünlerin görünüm sırasını değiştirebilirsiniz.
                           </p>
                        </div>
                     </div>
 
                     <div className="pt-6 border-t border-gray-100 space-y-4">
                        {step === 2 && (
                          <Button 
                            className="w-full h-14 bg-black hover:bg-black/90 text-white rounded-[20px] font-bold text-lg shadow-xl hover:translate-y-[-2px] transition-all"
                            onClick={() => setStep(3)}
                            disabled={lookItems.length === 0}
                          >
                             Ayarlara Geç <ArrowRight className="ml-2 w-5 h-5" />
                          </Button>
                        )}
                        {step === 3 && (
                          <div className="grid grid-cols-2 gap-4">
                             <Button variant="outline" className="h-14 rounded-[20px] font-bold" onClick={() => setStep(2)}>
                               <ArrowLeft className="mr-2 w-5 h-5" /> Seçime Dön
                             </Button>
                             <Button 
                               className="h-14 bg-black hover:bg-black/90 text-white rounded-[20px] font-bold shadow-xl flex items-center justify-center gap-2"
                               onClick={() => handleSave(true)}
                               disabled={loading}
                             >
                               <Layout className="w-5 h-5" /> Kombinasyonu Yayınla
                             </Button>
                          </div>
                        )}
                     </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-gray-300">
                    <Layout className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="italic text-sm">Lütfen önce bir ana ürün seçin</p>
                  </div>
                )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
