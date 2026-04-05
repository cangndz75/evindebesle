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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { generateSlug, generateVariantCode } from "@/lib/slug";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  uploadBase64ToCloudinary,
  uploadFileToCloudinary,
  processHtmlImages
} from "@/lib/cloudinary";

type Color = {
  name: string;
  hexCode: string;
  description?: string;
  images: string[];
  price?: number; // Renk bazlı fiyat (opsiyonel)
  sizeStocks?: { [sizeName: string]: number }; // Her beden için stok
};

type Size = {
  name: string;
  stock: number;
};

type SizeOption = {
  name: string;
};

export function AddProductModal({ onSuccess, children }: { onSuccess: () => void | Promise<void>; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [description, setDescription] = useState("");
  const [detailText, setDetailText] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [image, setImage] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Yüklenen tüm fotoğraflar
  const [primaryImage, setPrimaryImage] = useState("");
  const [secondaryImage, setSecondaryImage] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "UNISEX" | "">("");
  const [sizeType, setSizeType] = useState<"LETTER" | "NUMBER" | "">("");
  const [fabricType, setFabricType] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [primaryColor, setPrimaryColor] = useState<Color | null>(null);
  const [primaryColorName, setPrimaryColorName] = useState("");
  const [primaryColorHex, setPrimaryColorHex] = useState("");

  const [colors, setColors] = useState<Color[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("");

  const [sizes, setSizes] = useState<Size[]>([]);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeStock, setNewSizeStock] = useState("0");

  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);
  const [selectedSizeOptions, setSelectedSizeOptions] = useState<string[]>([]);

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const [combinations, setCombinations] = useState<string[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const addPrimaryColor = () => {
    if (!primaryColorName) return;
    setPrimaryColor({
      name: primaryColorName,
      hexCode: primaryColorHex,
      images: [],
      price: undefined,
      sizeStocks: {}
    });
    setPrimaryColorName("");
    setPrimaryColorHex("");
  };

  const addColor = () => {
    if (!newColorName) return;
    setColors([...colors, {
      name: newColorName,
      hexCode: newColorHex,
      images: [],
      price: undefined,
      sizeStocks: {}
    }]);
    setNewColorName("");
    setNewColorHex("");
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      return await uploadFileToCloudinary(file);
    });

    const results = await Promise.all(uploadPromises);

    return results.filter((url): url is string => url !== null);
  };


  const addColorImage = async (colorIndex: number, imageUrl?: string, files?: File[]) => {
    if (imageUrl && imageUrl.startsWith("data:image")) {
      setLoading(true);
      try {
        const cloudinaryUrl = await uploadBase64ToCloudinary(imageUrl);
        if (cloudinaryUrl) {
          setColors((prev) => {
            const updated = [...prev];
            if (updated[colorIndex]) {
              updated[colorIndex] = {
                ...updated[colorIndex],
                images: [...updated[colorIndex].images, cloudinaryUrl],
              };
            }
            return updated;
          });
        } else {
          toast.error("Görsel Cloudinary'e yüklenemedi");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Görsel yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
      return;
    }

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
        toast.error("Fotoğraflar yüklenirken hata oluştu");
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
    setSearchResults(data.filter((p: any) => !combinations.includes(p.id)));
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
      let finalImage = image;
      let finalPrimaryImage = primaryImage;
      let finalSecondaryImage = secondaryImage;

      if (image?.startsWith("data:image")) {
        const url = await uploadBase64ToCloudinary(image);
        if (!url) throw new Error("Ana görsel yüklenemedi");
        finalImage = url;
      }
      if (primaryImage?.startsWith("data:image")) {
        const url = await uploadBase64ToCloudinary(primaryImage);
        if (!url) throw new Error("Birinci görsel yüklenemedi");
        finalPrimaryImage = url;
      }
      if (secondaryImage?.startsWith("data:image")) {
        const url = await uploadBase64ToCloudinary(secondaryImage);
        if (!url) throw new Error("İkinci görsel yüklenemedi");
        finalSecondaryImage = url;
      }

      const processedColors = await Promise.all(
        colors.map(async (c) => {
          const processedImages = await Promise.all(
            c.images.map(async (img: string) => {
              if (img.startsWith("data:image")) {
                const url = await uploadBase64ToCloudinary(img);
                if (!url) {
                  throw new Error(`${c.name} rengi için görsel yüklenemedi`);
                }
                return url;
              }
              return img;
            })
          );
          return {
            ...c,
            images: processedImages,
          };
        })
      );

      const processedDetailText = await processHtmlImages(detailText);

      const productData = {
        name,
        slug: generateSlug(name),
        stockCode: stockCode || undefined,
        description: description || undefined,
        detailText: processedDetailText || undefined,
        price: parseFloat(price),
        image: finalImage || undefined,
        primaryImage: finalPrimaryImage || finalImage || undefined,
        secondaryImage: finalSecondaryImage || undefined,
        gender: gender || undefined,
        sizeType: sizeType || undefined,
        fabricType: fabricType || undefined,
        isActive,
        colors: [
          ...(primaryColor ? [{
            name: primaryColor.name,
            hexCode: primaryColor.hexCode || undefined,
            images: await Promise.all(primaryColor.images.map(async (img: string) => {
              if (img.startsWith("data:image")) {
                const url = await uploadBase64ToCloudinary(img);
                if (!url) throw new Error(`${primaryColor.name} rengi için görsel yüklenemedi`);
                return url;
              }
              return img;
            })).then(imgs => imgs.filter((img): img is string => !!img)),
            price: primaryColor.price,
            sizeStocks: primaryColor.sizeStocks || {},
          }] : []),
          ...processedColors.map((c) => ({
            name: c.name,
            hexCode: c.hexCode || undefined,
            images: c.images.filter((img): img is string => !!img),
            price: c.price,
            sizeStocks: c.sizeStocks || {},
          })),
        ],
        sizes: sizes.map((s) => ({
          name: s.name,
          stock: s.stock,
        })),
        tags: tags.map((t) => ({ name: t })),
        sizeOptions: selectedSizeOptions.map((so) => ({ name: so })),
        combinations: combinations,
      };

      const res = await fetch("/api/admin-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        setOpen(false);
        resetForm();
        onSuccess();
      } else {
        const error = await res.json();
        toast.error("Hata: " + (error.error || "Bilinmeyen hata"));
      }
    } catch (error: any) {
      console.error("Hata:", error);
      toast.error(error.message || "Ürün eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setStockCode("");
    setDescription("");
    setDetailText("");
    setPrice("");
    setOriginalPrice("");
    setImage("");
    setPrimaryImage("");
    setSecondaryImage("");
    setUploadedImages([]);
    setPrimaryColor(null);
    setPrimaryColorName("");
    setPrimaryColorHex("");
    setGender("");
    setSizeType("");
    setIsActive(true);
    setColors([]);
    setSizes([]);
    setTags([]);
    setCombinations([]);
    setSizeOptions([]);
    setSelectedSizeOptions([]);
  };

  const letterSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const numberSizes = ["30", "32", "34", "36", "38", "40", "42", "44", "46"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full sm:w-auto">
            Yeni Ürün Ekle
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl h-[95vh] md:h-[90vh] w-[95vw] md:w-full flex flex-col p-0 md:p-6">
        <DialogHeader className="px-4 md:px-0 pt-4 md:pt-0">
          <DialogTitle className="text-xl md:text-2xl font-bold">Yeni Ürün Ekle</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col overflow-hidden">
          <div className="px-4 md:px-0 border-b border-gray-200 overflow-x-auto">
            <TabsList className="grid w-full grid-cols-5 min-w-[500px] md:min-w-0 h-12 md:h-10">
              <TabsTrigger value="basic" className="text-xs md:text-sm px-2 md:px-4">Temel</TabsTrigger>
              <TabsTrigger value="colors" className="text-xs md:text-sm px-2 md:px-4">Renkler</TabsTrigger>
              <TabsTrigger value="stock" className="text-xs md:text-sm px-2 md:px-4">Stok</TabsTrigger>
              <TabsTrigger value="details" className="text-xs md:text-sm px-2 md:px-4">Detaylar</TabsTrigger>
              <TabsTrigger value="combinations" className="text-xs md:text-sm px-2 md:px-4">Kombinler</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="basic" className="space-y-5 md:space-y-4 mt-4 md:mt-4 flex-1 overflow-y-auto px-4 md:px-0 pb-4 md:pb-0">
            <div className="space-y-2">
              <Label className="text-sm md:text-base font-semibold">Ürün Adı *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ürün adı"
                className="h-12 md:h-10 text-base md:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm md:text-base font-semibold">Stok Kodu</Label>
              <Input
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                placeholder="SKU-001"
                className="h-12 md:h-10 text-base md:text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
              <div className="space-y-2">
                <Label className="text-sm md:text-base font-semibold">Fiyat *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-12 md:h-10 text-base md:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm md:text-base font-semibold">Orijinal Fiyat (İndirimli ürünler için)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-12 md:h-10 text-base md:text-sm"
                />
                {originalPrice && price && parseFloat(originalPrice) > parseFloat(price) && (
                  <p className="text-xs md:text-xs text-green-600 font-medium mt-1">
                    İndirim: %{Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
              <div className="space-y-2">
                <Label className="text-sm md:text-base font-semibold">Cinsiyet</Label>
                <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                  <SelectTrigger className="h-12 md:h-10 text-base md:text-sm">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
              <div className="space-y-2">
                <Label className="text-sm md:text-base font-semibold">Beden Tipi</Label>
                <Select value={sizeType} onValueChange={(v: any) => {
                  const oldSizeType = sizeType;
                  setSizeType(v);
                  if (oldSizeType !== v) {
                    setSelectedSizeOptions([]);
                  }
                  if (v === "LETTER") {
                    setSizeOptions(letterSizes.map(s => ({ name: s })));
                  } else if (v === "NUMBER") {
                    setSizeOptions(numberSizes.map(s => ({ name: s })));
                  }
                }}>
                  <SelectTrigger className="h-12 md:h-10 text-base md:text-sm">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LETTER">Harf (XS, S, M, L, XL)</SelectItem>
                    <SelectItem value="NUMBER">Numara (30, 32, 34, ...)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm md:text-base font-semibold">Kumaş Tipi</Label>
                <Input
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  placeholder="Örn: Pamuk, Polyester"
                  className="h-12 md:h-10 text-base md:text-sm"
                />
              </div>
            </div>
            {sizeType && (
              <div className="space-y-2">
                <Label className="text-sm md:text-base font-semibold">Beden Seçenekleri</Label>
                <div className="flex flex-wrap gap-3 md:gap-2 mt-2">
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
                        className="w-5 h-5 md:w-4 md:h-4"
                      />
                      <Label htmlFor={`size-${size}`} className="cursor-pointer text-base md:text-sm">
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm md:text-base font-semibold">Kısa Açıklama</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kısa ürün açıklaması"
                rows={4}
                className="text-base md:text-sm min-h-[100px] md:min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm md:text-base font-semibold">Slug (URL)</Label>
              <p className="text-sm md:text-sm text-gray-600 mt-1 p-3 md:p-2 bg-gray-50 rounded-md border border-gray-200">
                {generateSlug(name) || "Ürün adı girildiğinde otomatik oluşturulacak"}
              </p>
            </div>

            
            <div className="border-t border-gray-200 pt-5 md:pt-4 mt-5 md:mt-4">
              <Label className="text-base md:text-base font-semibold mb-4 md:mb-3 block">Ana Renk</Label>
              {!primaryColor ? (
                <div className="space-y-3 md:space-y-2">
                  <div className="flex flex-col md:flex-row gap-3 md:gap-2">
                    <Input
                      placeholder="Renk adı (örn: Kırmızı)"
                      value={primaryColorName}
                      onChange={(e) => setPrimaryColorName(e.target.value)}
                      className="flex-1 min-w-0 h-12 md:h-10 text-base md:text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColorHex || "#FF0000"}
                        onChange={(e) => setPrimaryColorHex(e.target.value)}
                        className="w-14 h-12 md:w-12 md:h-10 rounded-md border-2 border-gray-300 cursor-pointer"
                        title="Renk seç"
                      />
                      <Input
                        placeholder="#FF0000"
                        value={primaryColorHex}
                        onChange={(e) => setPrimaryColorHex(e.target.value)}
                        className="w-28 md:w-24 h-12 md:h-10 text-base md:text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addPrimaryColor}
                      disabled={!primaryColorName}
                      className="h-12 md:h-10 px-6 md:px-4"
                    >
                      <Plus className="w-5 h-5 md:w-4 md:h-4 mr-2 md:mr-0" />
                      <span className="md:hidden">Ekle</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: primaryColor.hexCode || "#ccc" }}
                      />
                      <span className="font-medium">{primaryColor.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimaryColor(null)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Renk Açıklaması ({primaryColor.name})</Label>
                      <Textarea
                        value={primaryColor.description || ""}
                        onChange={(e) => setPrimaryColor({ ...primaryColor, description: e.target.value })}
                        placeholder={`${primaryColor.name} renk seçeneği için özel açıklama...`}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Renk Fotoğrafları</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id={`primary-color-image-upload`}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              setLoading(true);
                              try {
                                const uploadedUrls = await uploadFiles(Array.from(files));
                                if (uploadedUrls.length > 0) {
                                  setPrimaryColor({
                                    ...primaryColor,
                                    images: [...primaryColor.images, ...uploadedUrls],
                                  });
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
                          variant="outline"
                          onClick={() => document.getElementById(`primary-color-image-upload`)?.click()}
                          disabled={loading}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Fotoğraf Ekle
                        </Button>
                      </div>
                      <Input
                        type="text"
                        placeholder="veya Görsel URL girin (base64 desteklenir)..."
                        className="text-sm"
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            const input = e.target as HTMLInputElement;
                            const value = input.value;

                            if (value) {
                              if (value.startsWith("data:image")) {
                                setLoading(true);
                                try {
                                  const cloudinaryUrl = await uploadBase64ToCloudinary(value);
                                  if (cloudinaryUrl) {
                                    setPrimaryColor({
                                      ...primaryColor,
                                      images: [...primaryColor.images, cloudinaryUrl],
                                    });
                                    toast.success("Görsel Cloudinary'e yüklendi");
                                  } else {
                                    toast.error("Görsel yüklenemedi");
                                  }
                                } catch (error) {
                                  console.error("Upload error:", error);
                                  toast.error("Görsel yüklenirken hata oluştu");
                                } finally {
                                  setLoading(false);
                                }
                              } else {
                                setPrimaryColor({
                                  ...primaryColor,
                                  images: [...primaryColor.images, value],
                                });
                              }
                              input.value = "";
                            }
                          }
                        }}
                      />
                      {primaryColor.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {primaryColor.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative">
                              <img
                                src={img}
                                alt={`${primaryColor.name} ${imgIdx + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPrimaryColor({
                                    ...primaryColor,
                                    images: primaryColor.images.filter((_, i) => i !== imgIdx),
                                  });
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm md:text-base font-semibold">Ana Görsel</Label>
              <div className="space-y-3 md:space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="main-image-upload"
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
                            toast.error("Fotoğraflar yüklenirken hata oluştu");
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
                      className="w-full h-12 md:h-10 text-base md:text-sm bg-black hover:bg-gray-800 text-white"
                      onClick={() => document.getElementById("main-image-upload")?.click()}
                      disabled={loading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 md:w-4 md:h-4 mr-2"
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
                      {loading ? "Yükleniyor..." : "Fotoğraf Yükle"}
                    </Button>
                  </div>
                </div>
                <Input
                  value={image}
                  className="h-12 md:h-10 text-sm"
                  onChange={async (e) => {
                    const value = e.target.value;

                    if (value.startsWith("data:image")) {
                      setLoading(true);
                      try {
                        const cloudinaryUrl = await uploadBase64ToCloudinary(value);
                        if (cloudinaryUrl) {
                          setImage(cloudinaryUrl);
                          if (!uploadedImages.includes(cloudinaryUrl)) {
                            setUploadedImages((prev) => [...prev, cloudinaryUrl]);
                          }
                          toast.success("Görsel Cloudinary'e yüklendi");
                        } else {
                          toast.error("Görsel yüklenemedi");
                        }
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast.error("Görsel yüklenirken hata oluştu");
                      } finally {
                        setLoading(false);
                      }
                    } else {
                      setImage(value);
                      if (value && !uploadedImages.includes(value)) {
                        setUploadedImages((prev) => [...prev, value]);
                      }
                    }
                  }}
                  placeholder="veya Görsel URL girin (base64 desteklenir)..."
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
                                  if (primaryImage === imgUrl) {
                                    setPrimaryImage("");
                                  } else {
                                    if (secondaryImage === imgUrl) {
                                      toast.warning("Bir fotoğraf hem ana hem ikinci fotoğraf olamaz!");
                                      return;
                                    }
                                    setPrimaryImage(imgUrl);
                                  }
                                }}
                                onChange={() => { }} // onChange boş, onClick kullanıyoruz
                                className="w-4 h-4 cursor-pointer accent-green-600"
                                style={{
                                  width: '16px',
                                  height: '16px',
                                }}
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
                                  if (secondaryImage === imgUrl) {
                                    setSecondaryImage("");
                                  } else {
                                    if (!primaryImage) {
                                      toast.warning("Önce ana fotoğraf seçmelisiniz!");
                                      return;
                                    }
                                    if (primaryImage === imgUrl) {
                                      toast.warning("Bir fotoğraf hem ana hem ikinci fotoğraf olamaz!");
                                      return;
                                    }
                                    setSecondaryImage(imgUrl);
                                  }
                                }}
                                onChange={() => { }} // onChange boş, onClick kullanıyoruz
                                className="w-4 h-4 cursor-pointer accent-blue-600"
                                style={{
                                  width: '16px',
                                  height: '16px',
                                }}
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
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Aktif
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-5 md:space-y-4 mt-4 md:mt-4 flex-1 overflow-y-auto px-4 md:px-0 pb-4 md:pb-0">
            <div className="space-y-2">
              <Label className="text-sm md:text-base font-semibold">Yeni Renk Ekle</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  placeholder="Renk adı (örn: Kırmızı)"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="flex-1 min-w-[150px]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColorHex || "#FF0000"}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                    title="Renk seç"
                  />
                  <Input
                    placeholder="#FF0000"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-24"
                  />
                </div>
                <Button type="button" onClick={addColor} disabled={!newColorName}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {colors.map((color, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg mb-4 px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: color.hexCode || "#ccc" }}
                        />
                        <span className="font-medium">{color.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-6">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColor(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Rengi Kaldır
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Renk Açıklaması ({color.name})</Label>
                        <Textarea
                          value={color.description || ""}
                          onChange={(e) => {
                            const newColors = [...colors];
                            newColors[index] = { ...color, description: e.target.value };
                            setColors(newColors);
                          }}
                          placeholder={`${color.name} için özel açıklama...`}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fiyat ({color.name})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={color.price || ""}
                            onChange={(e) => {
                              const newColors = [...colors];
                              newColors[index] = {
                                ...color,
                                price: e.target.value ? parseFloat(e.target.value) : undefined
                              };
                              setColors(newColors);
                            }}
                            placeholder="Ana fiyatı kullanmak için boş bırakın"
                          />
                        </div>
                      </div>

                      {sizeType && selectedSizeOptions.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Beden Stokları ({color.name})</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedSizeOptions.map((size) => {
                              const sizeStock = color.sizeStocks?.[size] || 0;
                              return (
                                <div key={size} className="space-y-1">
                                  <Label className="text-xs">{size}</Label>
                                  <Input
                                    type="number"
                                    value={sizeStock}
                                    onChange={(e) => {
                                      const newStock = parseInt(e.target.value) || 0;
                                      const newColors = [...colors];
                                      newColors[index] = {
                                        ...color,
                                        sizeStocks: {
                                          ...(color.sizeStocks || {}),
                                          [size]: newStock
                                        }
                                      };
                                      setColors(newColors);
                                    }}
                                    placeholder="0"
                                    className="h-9"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label>Fotoğraflar</Label>
                        <div className="space-y-2">
                          <div className="relative">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              id={`color-image-${index}`}
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  await addColorImage(index, undefined, Array.from(files));
                                }
                                e.target.value = "";
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById(`color-image-${index}`)?.click()}
                              disabled={loading}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Fotoğraf Yükle
                            </Button>
                          </div>
                          <Input
                            placeholder="veya Fotoğraf URL girin..."
                            className="text-sm"
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
                        {color.images.length > 0 && (
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                            {color.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="relative aspect-square">
                                <img
                                  src={img}
                                  alt={`${color.name} ${imgIndex + 1}`}
                                  className="w-full h-full object-cover rounded border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full"
                                  onClick={() => removeColorImage(index, imgIndex)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-5 md:space-y-4 mt-4 md:mt-4 flex-1 overflow-y-auto px-4 md:px-0 pb-4 md:pb-0">
            
            <div className="space-y-4 border-b border-gray-200 pb-4">
              <div>
                <Label className="text-lg font-semibold">Ana Ürün</Label>
                <p className="text-sm text-muted-foreground mb-4">Ana ürün için genel stok ve fiyat ayarları</p>
              </div>

              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fiyat (Ana Ürün)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              
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

            
            {primaryColor && (
              <div className="space-y-4 border-b pb-4">
                <div>
                  <Label className="text-lg font-semibold">Ana Renk: {primaryColor.name}</Label>
                </div>

                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fiyat ({primaryColor.name})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={primaryColor.price || ""}
                      onChange={(e) => {
                        setPrimaryColor({
                          ...primaryColor,
                          price: e.target.value ? parseFloat(e.target.value) : undefined
                        });
                      }}
                      placeholder="Ana ürün fiyatı"
                    />
                  </div>
                </div>

                
                {sizeType && selectedSizeOptions.length > 0 && (
                  <div>
                    <Label>Beden Stokları ({primaryColor.name})</Label>
                    <div className="space-y-2 mt-2">
                      {selectedSizeOptions.map((size) => {
                        const sizeStock = primaryColor.sizeStocks?.[size] || 0;
                        return (
                          <div key={size} className="flex items-center gap-2">
                            <Label className="w-16">{size}</Label>
                            <Input
                              type="number"
                              value={sizeStock}
                              onChange={(e) => {
                                const newStock = parseInt(e.target.value) || 0;
                                setPrimaryColor({
                                  ...primaryColor,
                                  sizeStocks: {
                                    ...(primaryColor.sizeStocks || {}),
                                    [size]: newStock
                                  }
                                });
                              }}
                              placeholder="0"
                              className="w-32"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            
            {colors.map((color, colorIndex) => (
              <div key={colorIndex} className="space-y-4 border-b pb-4">
                <div>
                  <Label className="text-lg font-semibold">Renk: {color.name}</Label>
                </div>

                
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
                    />
                  </div>
                </div>

                
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
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!primaryColor && colors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Önce renk ekleyin, sonra stok yönetimi yapabilirsiniz.
              </p>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-5 md:space-y-4 mt-4 md:mt-4 flex-1 overflow-y-auto px-4 md:px-0 pb-4 md:pb-0">
            <div className="space-y-2">
              <Label className="text-sm md:text-base font-semibold">Detay Metni (HTML desteklenir)</Label>
              <Textarea
                value={detailText}
                onChange={(e) => setDetailText(e.target.value)}
                placeholder="<p>Kalın yazı</p><p>Normal yazı</p>"
                rows={10}
                className="font-mono"
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
                />
                <Button type="button" onClick={addTag}>
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
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="combinations" className="space-y-5 md:space-y-4 mt-4 md:mt-4 flex-1 overflow-y-auto px-4 md:px-0 pb-4 md:pb-0">
            <div className="space-y-2">
              <Label className="text-sm md:text-base font-semibold">Ürün Ara</Label>
              <Input
                placeholder="Ürün adı ile ara..."
                value={searchProduct}
                onChange={(e) => {
                  setSearchProduct(e.target.value);
                  searchProducts(e.target.value);
                }}
                className="h-12 md:h-10 text-base md:text-sm"
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
                      <Button type="button" size="sm" variant="ghost">
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
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-4 md:px-0 pb-4 md:pb-0 pt-4 md:pt-0 border-t border-gray-200 md:border-0 flex-col sm:flex-row gap-2 md:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="w-full sm:w-auto h-12 md:h-10 text-base md:text-sm order-2 sm:order-1"
          >
            İptal
          </Button>
          <Button
            disabled={loading || !name || !price}
            onClick={handleSubmit}
            className="w-full sm:w-auto h-12 md:h-10 text-base md:text-sm order-1 sm:order-2 bg-black hover:bg-gray-800 text-white"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 md:h-4 md:w-4 mr-2 inline-block"
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
