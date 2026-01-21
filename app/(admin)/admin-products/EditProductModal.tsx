"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { generateSlug } from "@/lib/slug";
import { toast } from "sonner";

type Color = {
  name: string;
  hexCode: string;
  images: string[];
  price?: number; // Renk bazlı fiyat (opsiyonel)
  sizeStocks?: { [sizeName: string]: number }; // Her beden için stok
};

type Size = {
  name: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  stockCode?: string;
  description?: string;
  detailText?: string;
  price: number;
  image?: string;
  gender?: "MALE" | "FEMALE" | "UNISEX";
  sizeType?: "LETTER" | "NUMBER";
  isActive: boolean;
  colors?: Array<{ name: string; hexCode?: string; images: string[] }>;
  sizes?: Array<{ name: string; stock: number }>;
  tags?: Array<{ name: string }>;
  sizeOptions?: Array<{ name: string }>;
  combinations?: Array<{ relatedProductId: string; relatedProduct?: { id: string; name: string } }>;
};

export function EditProductModal({
  product,
  onSuccess,
  trigger,
}: {
  product: Product;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // Temel bilgiler
  const [name, setName] = useState(product.name);
  const [stockCode, setStockCode] = useState(product.stockCode || "");
  const [description, setDescription] = useState(product.description || "");
  const [detailText, setDetailText] = useState(product.detailText || "");
  const [price, setPrice] = useState(product.price.toString());
  const [originalPrice, setOriginalPrice] = useState(((product as any).originalPrice || "").toString());
  const [image, setImage] = useState(product.image || "");
  const [uploadedImages, setUploadedImages] = useState<string[]>(() => {
    // Mevcut fotoğrafları başlangıç değeri olarak ekle
    const images: string[] = [];
    if (product.image) images.push(product.image);
    if ((product as any).primaryImage && !images.includes((product as any).primaryImage)) {
      images.push((product as any).primaryImage);
    }
    if ((product as any).secondaryImage && !images.includes((product as any).secondaryImage)) {
      images.push((product as any).secondaryImage);
    }
    return images;
  });
  const [primaryImage, setPrimaryImage] = useState((product as any).primaryImage || "");
  const [secondaryImage, setSecondaryImage] = useState((product as any).secondaryImage || "");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "UNISEX" | "">(product.gender || "");
  const [sizeType, setSizeType] = useState<"LETTER" | "NUMBER" | "">(product.sizeType || "");
  const [fabricType, setFabricType] = useState((product as any).fabricType || "");
  const [isActive, setIsActive] = useState(product.isActive);

  // Renkler
  const [colors, setColors] = useState<Color[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("");

  // Bedenler
  const [sizes, setSizes] = useState<Size[]>([]);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeStock, setNewSizeStock] = useState("0");

  // Beden seçenekleri
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);
  const [selectedSizeOptions, setSelectedSizeOptions] = useState<string[]>([]);

  // Etiketler
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Ürün kombinleri
  const [combinations, setCombinations] = useState<string[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  type SizeOption = {
    name: string;
  };

  // Modal açıldığında tam veriyi yükle
  useEffect(() => {
    if (open) {
      loadProductData();
    }
  }, [open, product.id]);

  const loadProductData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/admin-products`);
      const products = await res.json();
      const fullProduct = products.find((p: Product) => p.id === product.id);
      
      if (fullProduct) {
        setName(fullProduct.name);
        setStockCode(fullProduct.stockCode || "");
        setDescription(fullProduct.description || "");
        setDetailText(fullProduct.detailText || "");
        setPrice(fullProduct.price.toString());
        setOriginalPrice(((fullProduct as any).originalPrice || "").toString());
        setImage(fullProduct.image || "");
        setGender(fullProduct.gender || "");
        setSizeType(fullProduct.sizeType || "");
        setIsActive(fullProduct.isActive);
        
        // Variant'ları renk bazlı grupla
        const variantsByColor: { [colorId: string]: any[] } = {};
        (fullProduct.variants || []).forEach((v: any) => {
          if (v.colorId) {
            if (!variantsByColor[v.colorId]) {
              variantsByColor[v.colorId] = [];
            }
            variantsByColor[v.colorId].push(v);
          }
        });

        setColors(
          (fullProduct.colors || []).map((c: any) => {
            const colorVariants = variantsByColor[c.id] || [];
            const sizeStocks: { [sizeName: string]: number } = {};
            let colorPrice: number | undefined = undefined;

            // Variant'lardan fiyat ve stok bilgilerini çıkar
            colorVariants.forEach((v: any) => {
              if (v.price) {
                colorPrice = v.price;
              }
              if (v.size && v.size.name) {
                sizeStocks[v.size.name] = v.stock || 0;
              }
            });

            return {
              name: c.name,
              hexCode: c.hexCode || "",
              images: c.images || [],
              price: colorPrice,
              sizeStocks: sizeStocks,
            };
          })
        );
        
        setSizes(
          (fullProduct.sizes || []).map((s: any) => ({
            name: s.name,
            stock: s.stock || 0,
          }))
        );
        
        setTags((fullProduct.tags || []).map((t: any) => t.name));
        
        // Beden seçeneklerini yükle
        if (fullProduct.sizeType === "LETTER") {
          setSizeOptions(letterSizes.map(s => ({ name: s })));
        } else if (fullProduct.sizeType === "NUMBER") {
          setSizeOptions(numberSizes.map(s => ({ name: s })));
        }
        
        // Seçili bedenleri yükle
        setSelectedSizeOptions((fullProduct.sizeOptions || []).map((so: any) => so.name));
        
        setCombinations(
          (fullProduct.combinations || []).map((c: any) => c.relatedProductId)
        );
      }
    } catch (error) {
      console.error("Ürün verisi yüklenirken hata:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const addColor = () => {
    if (!newColorName) return;
    setColors([...colors, { name: newColorName, hexCode: newColorHex, images: [] }]);
    setNewColorName("");
    setNewColorHex("");
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    // Tüm dosyaları paralel olarak yükle
    const uploadPromises = files.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        return uploadData.url || null;
      } catch (error) {
        console.error("Upload error:", error);
        return null;
      }
    });
    
    // Tüm yüklemeleri paralel olarak bekle
    const results = await Promise.all(uploadPromises);
    
    // Null değerleri filtrele
    return results.filter((url): url is string => url !== null);
  };

  const addColorImage = async (colorIndex: number, imageUrl?: string, files?: File[]) => {
    // URL ekleme
    if (imageUrl) {
      setColors((prev) => {
        const updated = [...prev];
        if (updated[colorIndex]) {
          updated[colorIndex] = {
            ...updated[colorIndex],
            images: [...updated[colorIndex].images, imageUrl],
          };
        }
        return updated;
      });
      return;
    }
    
    // Dosya yükleme (çoklu)
    if (files && files.length > 0) {
      setLoading(true);
      try {
        const uploadedUrls = await uploadFiles(Array.from(files));
        if (uploadedUrls.length > 0) {
          setColors((prev) => {
            const updated = [...prev];
            if (updated[colorIndex]) {
              updated[colorIndex] = {
                ...updated[colorIndex],
                images: [...updated[colorIndex].images, ...uploadedUrls],
              };
            }
            return updated;
          });
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Fotoğraflar yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }
  };

  const removeColorImage = (colorIndex: number, imageIndex: number) => {
    const updated = [...colors];
    updated[colorIndex].images = updated[colorIndex].images.filter((_, i) => i !== imageIndex);
    setColors(updated);
  };

  const addSize = () => {
    if (!newSizeName) return;
    setSizes([...sizes, { name: newSizeName, stock: parseInt(newSizeStock) || 0 }]);
    setNewSizeName("");
    setNewSizeStock("0");
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (!newTag || tags.includes(newTag)) return;
    setTags([...tags, newTag]);
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`/api/admin-products?search=${query}`);
    const data = await res.json();
    setSearchResults(data.filter((p: any) => p.id !== product.id && !combinations.includes(p.id)));
  };

  const addCombination = (productId: string) => {
    if (!combinations.includes(productId)) {
      setCombinations([...combinations, productId]);
    }
    setSearchProduct("");
    setSearchResults([]);
  };

  const removeCombination = (productId: string) => {
    setCombinations(combinations.filter((id) => id !== productId));
  };

  const handleSubmit = async () => {
    if (!name || !price) return;

    setLoading(true);

    try {
      const productData = {
        name,
        slug: generateSlug(name),
        stockCode: stockCode || undefined,
        description: description || undefined,
        detailText: detailText || undefined,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        image: image || undefined,
        primaryImage: primaryImage || undefined,
        secondaryImage: secondaryImage || undefined,
        gender: gender || undefined,
        sizeType: sizeType || undefined,
        fabricType: fabricType || undefined,
        isActive,
        colors: colors.map((c) => ({
          name: c.name,
          hexCode: c.hexCode || undefined,
          images: c.images,
          price: c.price,
          sizeStocks: c.sizeStocks || {},
        })),
        sizes: sizes.map((s) => ({
          name: s.name,
          stock: s.stock,
        })),
        tags: tags.map((t) => ({ name: t })),
        sizeOptions: selectedSizeOptions.map((so) => ({ name: so })),
        combinations: combinations,
      };

      const res = await fetch(`/api/admin-products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        setOpen(false);
        onSuccess?.();
      } else {
        const error = await res.json();
        alert("Hata: " + (error.error || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Ürün güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Beden seçenekleri
  const letterSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const numberSizes = ["30", "32", "34", "36", "38", "40", "42", "44", "46"];

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              Düzenle
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ürünü Düzenle</DialogTitle>
          </DialogHeader>
          <div className="p-4">Yükleniyor...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Düzenle
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ürünü Düzenle</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Temel</TabsTrigger>
            <TabsTrigger value="colors">Renkler</TabsTrigger>
            <TabsTrigger value="stock">Stok</TabsTrigger>
            <TabsTrigger value="details">Detaylar</TabsTrigger>
            <TabsTrigger value="combinations">Kombinler</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4 flex-1 overflow-y-auto">
            <div>
              <Label>Ürün Adı *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ürün adı"
                disabled={loading}
              />
            </div>
            <div>
              <Label>Stok Kodu</Label>
              <Input
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                placeholder="SKU-001"
                disabled={loading}
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <p className="text-sm text-muted-foreground mt-1 p-2 bg-gray-50 rounded border">
                {(product as any).slug || generateSlug(name) || "Ürün adı girildiğinde otomatik oluşturulacak"}
              </p>
              {name !== product.name && (
                <p className="text-xs text-amber-600 mt-1">
                  Ürün adı değiştiğinde slug otomatik güncellenecek
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fiyat *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Orijinal Fiyat (İndirimli ürünler için)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                />
                {originalPrice && price && parseFloat(originalPrice) > parseFloat(price) && (
                  <p className="text-xs text-gray-500 mt-1">
                    İndirim: %{Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cinsiyet</Label>
                <Select value={gender} onValueChange={(v: any) => setGender(v)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Erkek</SelectItem>
                    <SelectItem value="FEMALE">Kadın</SelectItem>
                    <SelectItem value="UNISEX">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Beden Tipi</Label>
                <Select value={sizeType} onValueChange={(v: any) => {
                  const oldSizeType = sizeType;
                  setSizeType(v);
                  // Eğer sizeType değiştiyse, seçili bedenleri temizle
                  if (oldSizeType !== v) {
                    setSelectedSizeOptions([]);
                  }
                  if (v === "LETTER") {
                    setSizeOptions(letterSizes.map(s => ({ name: s })));
                  } else if (v === "NUMBER") {
                    setSizeOptions(numberSizes.map(s => ({ name: s })));
                  }
                }} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LETTER">Harf (XS, S, M, L, XL)</SelectItem>
                    <SelectItem value="NUMBER">Numara (30, 32, 34, ...)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kumaş Tipi</Label>
                <Input
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  placeholder="Örn: Pamuk, Polyester"
                  disabled={loading}
                />
              </div>
            </div>
            {sizeType && (
              <div>
                <Label>Beden Seçenekleri</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(sizeType === "LETTER" ? letterSizes : numberSizes).map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={selectedSizeOptions.includes(size)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSizeOptions([...selectedSizeOptions, size]);
                          } else {
                            setSelectedSizeOptions(selectedSizeOptions.filter(s => s !== size));
                          }
                        }}
                        disabled={loading}
                      />
                      <Label htmlFor={`size-${size}`} className="cursor-pointer">
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Kısa Açıklama</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kısa ürün açıklaması"
                rows={3}
                disabled={loading}
              />
            </div>
            <div>
              <Label>Ana Görsel</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="main-image-upload"
                      disabled={loading}
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          setLoading(true);
                          try {
                            const uploadedUrls = await uploadFiles(Array.from(files));
                            if (uploadedUrls.length > 0) {
                              setUploadedImages((prev) => [...prev, ...uploadedUrls]);
                              if (!image) setImage(uploadedUrls[0]);
                              if (!primaryImage) setPrimaryImage(uploadedUrls[0]);
                            }
                          } catch (error) {
                            console.error("Upload error:", error);
                            alert("Fotoğraflar yüklenirken hata oluştu");
                          } finally {
                            setLoading(false);
                            e.target.value = "";
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="default"
                      className="w-full"
                      onClick={() => document.getElementById("main-image-upload")?.click()}
                      disabled={loading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {loading ? "Yükleniyor..." : "Fotoğraf Yükle (Çoklu Seçim)"}
                    </Button>
                  </div>
                </div>
                <Input
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    // URL'den eklendiğinde uploadedImages'a da ekle
                    if (e.target.value && !uploadedImages.includes(e.target.value)) {
                      setUploadedImages((prev) => [...prev, e.target.value]);
                    }
                  }}
                  placeholder="veya Görsel URL girin..."
                  className="text-sm"
                  disabled={loading}
                />
                {uploadedImages.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm font-medium">Yüklenen Fotoğraflar:</p>
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedImages.map((imgUrl, index) => (
                        <div key={index} className="space-y-2">
                          <div className="relative aspect-square">
                            <img
                              src={imgUrl}
                              alt={`Fotoğraf ${index + 1}`}
                              className="w-full h-full object-cover rounded border"
                            />
                            {primaryImage === imgUrl ? (
                              <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                                Ana Foto
                              </div>
                            ) : secondaryImage === imgUrl ? (
                              <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded z-10">
                                İkinci Foto
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                              <input
                                type="radio"
                                name={`primaryImage-${index}`}
                                checked={primaryImage === imgUrl}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (loading) return;
                                  if (primaryImage === imgUrl) {
                                    // Zaten seçiliyse kaldır
                                    setPrimaryImage("");
                                  } else {
                                    // Eğer bu fotoğraf ikinci foto olarak seçiliyse, önce onu kaldır
                                    if (secondaryImage === imgUrl) {
                                      toast.warning("Bir fotoğraf hem ana hem ikinci fotoğraf olamaz!");
                                      return;
                                    }
                                    // Yeni seçim yap
                                    setPrimaryImage(imgUrl);
                                  }
                                }}
                                onChange={() => {}} // onChange boş, onClick kullanıyoruz
                                className="w-4 h-4 cursor-pointer accent-green-600"
                                style={{
                                  width: '16px',
                                  height: '16px',
                                }}
                                disabled={loading}
                              />
                              <span className={primaryImage === imgUrl ? "font-semibold text-green-600" : ""}>
                                Ana foto olarak seç
                              </span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                              <input
                                type="radio"
                                name={`secondaryImage-${index}`}
                                checked={secondaryImage === imgUrl}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (loading) return;
                                  if (secondaryImage === imgUrl) {
                                    // Zaten seçiliyse kaldır
                                    setSecondaryImage("");
                                  } else {
                                    // Ana foto seçilmiş mi kontrol et
                                    if (!primaryImage) {
                                      toast.warning("Önce ana fotoğraf seçmelisiniz!");
                                      return;
                                    }
                                    // Eğer bu fotoğraf ana foto olarak seçiliyse, önce onu kaldır
                                    if (primaryImage === imgUrl) {
                                      toast.warning("Bir fotoğraf hem ana hem ikinci fotoğraf olamaz!");
                                      return;
                                    }
                                    // Yeni seçim yap
                                    setSecondaryImage(imgUrl);
                                  }
                                }}
                                onChange={() => {}} // onChange boş, onClick kullanıyoruz
                                className="w-4 h-4 cursor-pointer accent-blue-600"
                                style={{
                                  width: '16px',
                                  height: '16px',
                                }}
                                disabled={loading}
                              />
                              <span className={secondaryImage === imgUrl ? "font-semibold text-blue-600" : ""}>
                                İkinci fotoğraf olarak seç
                              </span>
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUploadedImages((prev) => prev.filter((_, i) => i !== index));
                                if (primaryImage === imgUrl) setPrimaryImage("");
                                if (secondaryImage === imgUrl) setSecondaryImage("");
                                if (image === imgUrl) {
                                  const remaining = uploadedImages.filter((_, i) => i !== index);
                                  setImage(remaining[0] || "");
                                }
                              }}
                              disabled={loading}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Aktif
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4 mt-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label>Yeni Renk Ekle</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  placeholder="Renk adı (örn: Kırmızı)"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  disabled={loading}
                  className="flex-1 min-w-[150px]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColorHex || "#FF0000"}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                    title="Renk seç"
                    disabled={loading}
                  />
                  <Input
                    placeholder="#FF0000"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-24"
                    disabled={loading}
                  />
                </div>
                <Button type="button" onClick={addColor} disabled={loading || !newColorName}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {colors.map((color, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: color.hexCode || "#ccc" }}
                      />
                      <span className="font-medium">{color.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColor(index)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Fotoğraflar</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id={`color-image-${index}`}
                          disabled={loading}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const fileArray = Array.from(files);
                              console.log(`Renk ${index} için ${fileArray.length} dosya seçildi`);
                              await addColorImage(index, undefined, fileArray);
                            }
                            // Reset input
                            e.target.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="default"
                          className="w-full"
                          onClick={() => {
                            document.getElementById(`color-image-${index}`)?.click();
                          }}
                          disabled={loading}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {loading ? "Yükleniyor..." : "Fotoğraf Yükle (Çoklu Seçim)"}
                        </Button>
                      </div>
                      <Input
                        placeholder="veya Fotoğraf URL girin..."
                        className="text-sm"
                        disabled={loading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            if (input.value) {
                              addColorImage(index, input.value);
                              input.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="mt-2">
                      {color.images.length > 0 && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {color.images.length} fotoğraf eklendi
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {color.images.map((img, imgIndex) => (
                          <div key={imgIndex} className="relative">
                            <img
                              src={img}
                              alt={`${color.name} ${imgIndex + 1}`}
                              className="w-20 h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 w-6 h-6 p-0"
                              onClick={() => removeColorImage(index, imgIndex)}
                              disabled={loading}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4 mt-4 flex-1 overflow-y-auto">
            {/* Ana Ürün Stok ve Fiyat */}
            <div className="space-y-4 border-b pb-4">
              <div>
                <Label className="text-lg font-semibold">Ana Ürün</Label>
                <p className="text-sm text-muted-foreground mb-4">Ana ürün için genel stok ve fiyat ayarları</p>
              </div>
              
              {/* Ana Ürün Fiyat */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fiyat (Ana Ürün)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Ana Ürün Beden Stokları */}
              {sizeType && selectedSizeOptions.length > 0 && (
                <div>
                  <Label>Beden Stokları (Ana Ürün)</Label>
                  <div className="space-y-2 mt-2">
                    {selectedSizeOptions.map((size) => {
                      const sizeStock = sizes.find(s => s.name === size)?.stock || 0;
                      return (
                        <div key={size} className="flex items-center gap-2">
                          <Label className="w-16">{size}</Label>
                          <Input
                            type="number"
                            value={sizeStock}
                            onChange={(e) => {
                              const newStock = parseInt(e.target.value) || 0;
                              const existingSizeIndex = sizes.findIndex(s => s.name === size);
                              if (existingSizeIndex >= 0) {
                                const newSizes = [...sizes];
                                newSizes[existingSizeIndex] = { name: size, stock: newStock };
                                setSizes(newSizes);
                              } else {
                                setSizes([...sizes, { name: size, stock: newStock }]);
                              }
                            }}
                            placeholder="0"
                            className="w-32"
                            disabled={loading}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {sizeType && selectedSizeOptions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Önce "Temel" tab'ında beden seçeneklerini seçin.
                </p>
              )}
            </div>

            {/* Renkler Stok ve Fiyat */}
            {colors.map((color, colorIndex) => (
              <div key={colorIndex} className="space-y-4 border-b pb-4">
                <div>
                  <Label className="text-lg font-semibold">Renk: {color.name}</Label>
                </div>
                
                {/* Renk Fiyat */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fiyat ({color.name})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={color.price || ""}
                      onChange={(e) => {
                        const newColors = [...colors];
                        newColors[colorIndex] = {
                          ...color,
                          price: e.target.value ? parseFloat(e.target.value) : undefined
                        };
                        setColors(newColors);
                      }}
                      placeholder="Ana ürün fiyatı"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Renk Beden Stokları */}
                {sizeType && selectedSizeOptions.length > 0 && (
                  <div>
                    <Label>Beden Stokları ({color.name})</Label>
                    <div className="space-y-2 mt-2">
                      {selectedSizeOptions.map((size) => {
                        const sizeStock = color.sizeStocks?.[size] || 0;
                        return (
                          <div key={size} className="flex items-center gap-2">
                            <Label className="w-16">{size}</Label>
                            <Input
                              type="number"
                              value={sizeStock}
                              onChange={(e) => {
                                const newStock = parseInt(e.target.value) || 0;
                                const newColors = [...colors];
                                newColors[colorIndex] = {
                                  ...color,
                                  sizeStocks: {
                                    ...(color.sizeStocks || {}),
                                    [size]: newStock
                                  }
                                };
                                setColors(newColors);
                              }}
                              placeholder="0"
                              className="w-32"
                              disabled={loading}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {colors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Önce renk ekleyin, sonra stok yönetimi yapabilirsiniz.
              </p>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-4 flex-1 overflow-y-auto">
            <div>
              <Label>Detay Metni (HTML desteklenir)</Label>
              <Textarea
                value={detailText}
                onChange={(e) => setDetailText(e.target.value)}
                placeholder="<p>Kalın yazı</p><p>Normal yazı</p>"
                rows={10}
                className="font-mono"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Etiketler</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Etiket adı (örn: Moda)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  disabled={loading}
                />
                <Button type="button" onClick={addTag} disabled={loading}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded"
                  >
                    <span>{tag}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4"
                      onClick={() => removeTag(tag)}
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="combinations" className="space-y-4 mt-4 flex-1 overflow-y-auto">
            <div>
              <Label>Ürün Ara</Label>
              <Input
                placeholder="Ürün adı ile ara..."
                value={searchProduct}
                onChange={(e) => {
                  setSearchProduct(e.target.value);
                  searchProducts(e.target.value);
                }}
                disabled={loading}
              />
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                      onClick={() => addCombination(product.id)}
                    >
                      <span>{product.name}</span>
                      <Button type="button" size="sm" variant="ghost" disabled={loading}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Seçili Ürünler</Label>
              <div className="space-y-2 mt-2">
                {combinations.map((productId) => (
                  <div
                    key={productId}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <span>ID: {productId}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCombination(productId)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            İptal
          </Button>
          <Button
            disabled={loading || !name || !price}
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-2 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Kaydediliyor...
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
