"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Layout, Plus, Edit2, Trash2, ExternalLink, Package, Eye, EyeOff, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
 
export default function AdminLooksListPage() {
  const router = useRouter();
  const [looks, setLooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetchLooks();
  }, []);
 
  const fetchLooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-look-configs");
      if (res.ok) {
        setLooks(await res.json());
      }
    } catch (e) {
      toast.error("Kombinler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };
 
  const handleDelete = async (id: string) => {
    if (!confirm("Bu kombinasyonu silmek istediğinize emin misiniz?")) return;
    
    try {
      const res = await fetch(`/api/admin-look-configs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Kombinasyon silindi.");
        fetchLooks();
      } else {
        toast.error("Silinemedi.");
      }
    } catch (e) {
      toast.error("Bir hata oluştu.");
    }
  };
 
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-black rounded-2xl">
            <Layout className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kombinasyon Yönetimi</h1>
            <p className="text-gray-500 mt-1">Mağazadaki tüm "Takımı Tamamla" setlerini yönetin</p>
          </div>
        </div>
        <Button onClick={() => router.push("/admin-product-combinations/new")} className="rounded-full px-8 h-12 bg-black hover:bg-black/90 font-bold shadow-lg flex items-center gap-2">
          <Plus className="w-5 h-5" /> Yeni Kombinasyon
        </Button>
      </div>
 
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-gray-50 rounded-3xl border-none shadow-sm" />)}
        </div>
      ) : looks.length === 0 ? (
        <Card className="border-none shadow-sm rounded-[40px] p-20 text-center bg-gray-50/50">
          <Package className="w-16 h-16 mx-auto mb-6 text-gray-200" />
          <h3 className="text-xl font-bold text-gray-900">Henüz kombinasyon yok</h3>
          <p className="text-gray-400 mt-2 mb-8">Ürün detay sayfalarında öneride bulunmak için ilk kombinasyonu oluşturun.</p>
          <Button onClick={() => router.push("/admin-product-combinations/new")} variant="outline" className="border-2 border-black rounded-full px-10 h-12 font-bold hover:bg-black hover:text-white transition-all">
            Hemen Oluştur
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {looks.map((look) => (
            <Card key={look.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[40px] overflow-hidden bg-white ring-1 ring-gray-100">
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                 <img 
                   src={look.mainProduct?.primaryImage || look.mainProduct?.image || "https://via.placeholder.com/400x500"} 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   alt={look.mainProduct?.name}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                    <div className="flex items-center justify-between mb-4">
                       <Badge className={`${look.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-gray-500'} text-white rounded-full px-3 py-1 font-bold text-[10px] tracking-widest uppercase`}>
                         {look.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
                       </Badge>
                       {!look.isVisible && <Badge variant="destructive" className="rounded-full flex items-center gap-1 font-black text-[10px] uppercase tracking-widest"><EyeOff className="w-3 h-3" /> Gizli</Badge>}
                    </div>
                    <h3 className="text-white text-xl font-bold line-clamp-2 leading-tight drop-shadow-md">{look.mainProduct?.name}</h3>
                    <p className="text-white/60 text-xs mt-2 flex items-center gap-2">
                       <Package className="w-3 h-3" /> {look.items?.length || 0} Tamamlayıcı Ürün
                    </p>
                 </div>
                 
                 <div className="absolute top-4 right-4 z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="w-10 h-10 rounded-full bg-white/90 backdrop-blur border-none shadow-xl hover:bg-white transition-all">
                          <MoreVertical className="h-5 w-5 text-black" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]">
                        <DropdownMenuItem onClick={() => router.push(`/admin-product-combinations/edit/${look.id}`)} className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                          <Edit2 className="w-4 h-4" /> Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/products/${look.mainProduct?.slug}`, '_blank')} className="rounded-xl flex items-center gap-3 py-3 cursor-pointer">
                          <ExternalLink className="w-4 h-4" /> Sayfaya Git
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(look.id)} className="rounded-xl flex items-center gap-3 py-3 text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer">
                          <Trash2 className="w-4 h-4" /> Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
              </div>
              <CardContent className="p-6">
                 <div className="flex justify-between items-center bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <div className="text-center flex-1 border-r border-gray-200">
                       <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Öncelik</p>
                       <p className="font-black text-sm">{look.priority || 0}</p>
                    </div>
                    <div className="text-center flex-1">
                       <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Başlık</p>
                       <p className="font-bold text-[11px] truncate px-2">{look.title || "Yok"}</p>
                    </div>
                 </div>
                 <Button onClick={() => router.push(`/admin-product-combinations/edit/${look.id}`)} className="w-full mt-6 rounded-2xl h-12 bg-black text-white hover:bg-gray-800 font-bold transition-all shadow-lg hover:translate-y-[-2px]">
                   Düzenlemeyi Aç
                 </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
