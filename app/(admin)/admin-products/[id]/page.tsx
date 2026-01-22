"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Eye,
  AlertTriangle,
  Package,
  Image as ImageIcon,
  Tag,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { InlineEditableCell } from "../_components/InlineEditableCell";

type Product = {
  id: string;
  name: string;
  slug: string | null;
  stockCode: string | null;
  description: string | null;
  detailText: string | null;
  price: number;
  originalPrice: number | null;
  image: string | null;
  gender: "MALE" | "FEMALE" | "UNISEX" | null;
  sizeType: "LETTER" | "NUMBER" | null;
  categoryId: string | null;
  brand: string | null;
  isActive: boolean;
  colors: Array<{
    id: string;
    name: string;
    hexCode: string | null;
    images: string[];
  }>;
  sizes: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
  variants: Array<{
    id: string;
    variantCode: string;
    colorId: string | null;
    sizeId: string | null;
    stock: number;
    price: number | null;
    color: { name: string } | null;
    size: { name: string } | null;
  }>;
  category: { id: string; name: string } | null;
  combinations: Array<{
    relatedProduct: { id: string; name: string; image: string | null };
  }>;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SEO alanları
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-products/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        // SEO alanlarını varsayılan değerlerle doldur
        setMetaTitle(data.name || "");
        setMetaDescription(data.description || "");
        setCanonicalUrl(data.slug ? `/products/${data.slug}` : "");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Ürün yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin-products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaTitle,
          metaDescription,
          canonicalUrl,
        }),
      });

      if (res.ok) {
        toast.success("Ürün güncellendi");
        fetchProduct();
      } else {
        throw new Error("Güncelleme başarısız");
      }
    } catch (error) {
      toast.error("Ürün güncellenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleVariantStockUpdate = async (variantId: string, newStock: number) => {
    try {
      const res = await fetch(`/api/admin-products/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      if (res.ok) {
        toast.success("Varyant stoku güncellendi");
        fetchProduct();
      }
    } catch (error) {
      toast.error("Stok güncellenirken bir hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Ürün bulunamadı</p>
        <Button onClick={() => router.back()}>Geri Dön</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-sm text-gray-600">
              {product.stockCode || "Stok kodu yok"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/products/${product.slug}`)}>
            <Eye className="w-4 h-4 mr-2" />
            Önizle
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="variants">Varyantlar</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="related">İlişkili Ürünler</TabsTrigger>
        </TabsList>

        {/* Genel Bilgiler */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Temel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Ürün Adı</Label>
                    <Input value={product.name} disabled className="mt-2" />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={product.slug || ""} disabled className="mt-2" />
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      value={product.description || ""}
                      disabled
                      className="mt-2 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label>Detay Metin</Label>
                    <Textarea
                      value={product.detailText || ""}
                      disabled
                      className="mt-2 min-h-[150px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Kalite Uyarıları */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Kalite Kontrolü
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {!product.image && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <ImageIcon className="w-4 h-4" />
                        <span>Görsel eksik</span>
                      </div>
                    )}
                    {(!product.colors || product.colors.length === 0) && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <Tag className="w-4 h-4" />
                        <span>Renk varyantı eksik</span>
                      </div>
                    )}
                    {(!product.sizes || product.sizes.length === 0) && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <Package className="w-4 h-4" />
                        <span>Beden varyantı eksik</span>
                      </div>
                    )}
                    {!product.description && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Açıklama eksik</span>
                      </div>
                    )}
                    {!product.stockCode && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <Tag className="w-4 h-4" />
                        <span>SKU eksik</span>
                      </div>
                    )}
                    {product.image &&
                      product.colors &&
                      product.colors.length > 0 &&
                      product.sizes &&
                      product.sizes.length > 0 &&
                      product.description &&
                      product.stockCode && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <span>✓ Tüm alanlar tamamlandı</span>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Durum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Yayın Durumu</Label>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Aktif" : "Taslak"}
                    </Badge>
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <p className="mt-2 text-sm">{product.category?.name || "Kategori yok"}</p>
                  </div>
                  <div>
                    <Label>Marka</Label>
                    <p className="mt-2 text-sm">{product.brand || "Marka yok"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Varyantlar */}
        <TabsContent value="variants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Varyant Yönetimi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.variants.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Henüz varyant eklenmemiş
                  </p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Varyant Kodu</th>
                          <th className="text-left p-3">Renk</th>
                          <th className="text-left p-3">Beden</th>
                          <th className="text-left p-3">Stok</th>
                          <th className="text-left p-3">Fiyat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((variant) => (
                          <tr key={variant.id} className="border-b">
                            <td className="p-3 font-mono text-sm">{variant.variantCode}</td>
                            <td className="p-3">
                              {variant.color ? (
                                <Badge variant="outline">{variant.color.name}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              {variant.size ? (
                                <Badge variant="outline">{variant.size.name}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <InlineEditableCell
                                value={variant.stock}
                                onSave={(value) => handleVariantStockUpdate(variant.id, Number(value))}
                                type="number"
                                className="w-20"
                              />
                            </td>
                            <td className="p-3">
                              {variant.price ? (
                                <span>{variant.price.toFixed(2)} ₺</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                SEO Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Ürün adı - Marka"
                  className="mt-2"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {metaTitle.length}/60 karakter (önerilen: 50-60)
                </p>
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Ürün açıklaması..."
                  className="mt-2 min-h-[100px]"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {metaDescription.length}/160 karakter (önerilen: 150-160)
                </p>
              </div>
              <div>
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="/products/urun-slug"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bu ürün için canonical URL (boş bırakılırsa otomatik oluşturulur)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* İlişkili Ürünler */}
        <TabsContent value="related" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>İlişkili Ürünler / Upsell</CardTitle>
            </CardHeader>
            <CardContent>
              {product.combinations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Henüz ilişkili ürün eklenmemiş
                </p>
              ) : (
                <div className="space-y-2">
                  {product.combinations.map((combo, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {combo.relatedProduct.image && (
                          <img
                            src={combo.relatedProduct.image}
                            alt={combo.relatedProduct.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <span className="font-medium">{combo.relatedProduct.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin-products/${combo.relatedProduct.id}`)}
                      >
                        Görüntüle
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
