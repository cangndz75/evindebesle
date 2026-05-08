"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { generateSlug, generateProductSlug } from "@/lib/slug";
import { toast } from "sonner";
import { ArrowLeft, X, Plus, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  uploadBase64ToCloudinary,
  processHtmlImages
} from "@/lib/cloudinary";
import { WashingInstructionModal } from "@/components/admin/WashingInstructionModal";
import { DeliveryInfoModal } from "@/components/admin/DeliveryInfoModal";
import { SizeNoteModal } from "@/components/admin/SizeNoteModal";
import { SizeGuideModal } from "@/components/admin/SizeGuideModal";
import { ModelInfoModal } from "@/components/admin/ModelInfoModal";

type Color = {
  name: string;
  images: string[];
  hexCode?: string;
  useMainPrice?: boolean;
  price?: string;
  originalPrice?: string;
  stock?: { [sizeName: string]: number };
  sizes?: string[]; // Renge özel bedenler
};

const letterSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const numberSizes = ["30", "32", "34", "36", "38", "40", "42", "44", "46", "48"];
const tagSuggestions = ["yeni", "çoksatan", "trend", "erkek", "kadın", "unisex", "sweatshirt", "içlik", "sütyen", "kulot", "yeni ürün", "best seller", "bestseller", "en çok satan"];

function normalizeSizeName(value: string): string {
  return String(value || "").trim().toUpperCase();
}

function inferSizeTypeFromNames(sizeNames: string[]): "LETTER" | "NUMBER" | "CUP" {
  const normalized = sizeNames
    .map(normalizeSizeName)
    .filter(Boolean);

  if (normalized.length === 0) return "LETTER";

  const isCup = normalized.every((name) => /^\d{2,3}[A-Z]+$/.test(name));
  if (isCup) return "CUP";

  const isNumber = normalized.every((name) => /^\d+$/.test(name));
  if (isNumber) return "NUMBER";

  return "LETTER";
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [name, setName] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "UNISEX" | "">("");
  const [fabricType, setFabricType] = useState("");
  const [weight, setWeight] = useState("");
  const [brand, setBrand] = useState("");

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState("");
  const [secondaryImage, setSecondaryImage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [primaryProductColor, setPrimaryProductColor] = useState<Color | null>(null);
  const [primaryProductColorName, setPrimaryProductColorName] = useState("");

  const [colors, setColors] = useState<Color[]>([]);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [newColorName, setNewColorName] = useState("");

  const [sizeType, setSizeType] = useState<"LETTER" | "NUMBER" | "CUP">("LETTER");
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [newSizeInput, setNewSizeInput] = useState("");
  const [sizeStocks, setSizeStocks] = useState<{ [key: string]: number }>({});

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [detailText, setDetailText] = useState("");

  const [washingInstructionId, setWashingInstructionId] = useState("");
  const [deliveryInfoId, setDeliveryInfoId] = useState("");
  const [sizeNoteId, setSizeNoteId] = useState("");
  const [sizeGuideId, setSizeGuideId] = useState("");
  const [modelInfoId, setModelInfoId] = useState("");

  const [washingInstructions, setWashingInstructions] = useState<any[]>([]);
  const [deliveryInfos, setDeliveryInfos] = useState<any[]>([]);
  const [sizeNotes, setSizeNotes] = useState<any[]>([]);
  const [sizeGuides, setSizeGuides] = useState<any[]>([]);
  const [modelInfos, setModelInfos] = useState<any[]>([]);

  const [washingModalOpen, setWashingModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [sizeNoteModalOpen, setSizeNoteModalOpen] = useState(false);
  const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);
  const [modelInfoModalOpen, setModelInfoModalOpen] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedImages((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeUploadedImage = (index: number) => {
    const imageToRemove = uploadedImages[index];
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    if (primaryImage === imageToRemove) {
      setPrimaryImage("");
    }
    if (secondaryImage === imageToRemove) {
      setSecondaryImage("");
    }
  };

  const addPrimaryProductColor = () => {
    if (!primaryProductColorName) return;
    const newColor: Color = {
      name: primaryProductColorName,
      images: [],
    };
    setPrimaryProductColor(newColor);
    setPrimaryProductColorName("");
  };

  const addColor = () => {
    if (!newColorName) return;
    const newColor: Color = {
      name: newColorName,
      images: [],
      useMainPrice: true,
      price: "",
      originalPrice: "",
      stock: {},
      sizes: [], // Başlangıçta boş, kullanıcı seçecek
    };
    setColors([...colors, newColor]);
    setNewColorName("");
    setSelectedColor(colors.length);
  };

  const updateColorStock = (colorIndex: number, sizeName: string, stockValue: number) => {
    const updatedColors = [...colors];
    if (!updatedColors[colorIndex].stock) {
      updatedColors[colorIndex].stock = {};
    }
    updatedColors[colorIndex].stock![sizeName] = stockValue;
    setColors(updatedColors);
  };

  const updateColorPrice = (index: number, field: "useMainPrice" | "price" | "originalPrice", value: boolean | string) => {
    const updatedColors = [...colors];
    updatedColors[index] = {
      ...updatedColors[index],
      [field]: value,
    };
    setColors(updatedColors);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
    if (selectedColor === index) {
      setSelectedColor(null);
    } else if (selectedColor !== null && selectedColor > index) {
      setSelectedColor(selectedColor - 1);
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
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

    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  };


  const addColorImage = async (colorIndex: number, imageUrl: string) => {
    if (imageUrl.startsWith("data:image")) {
      setLoading(true);
      try {
        const cloudinaryUrl = await uploadBase64ToCloudinary(imageUrl);
        if (cloudinaryUrl) {
          const updatedColors = [...colors];
          updatedColors[colorIndex].images.push(cloudinaryUrl);
          setColors(updatedColors);
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
      const updatedColors = [...colors];
      updatedColors[colorIndex].images.push(imageUrl);
      setColors(updatedColors);
    }
  };

  const handleColorImageFiles = async (colorIndex: number, files: FileList) => {
    setLoading(true);
    try {
      const uploadedUrls = await uploadFiles(Array.from(files));
      if (uploadedUrls.length > 0) {
        const updatedColors = [...colors];
        updatedColors[colorIndex].images.push(...uploadedUrls);
        setColors(updatedColors);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Fotoğraflar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const removeColorImage = (colorIndex: number, imageIndex: number) => {
    const updatedColors = [...colors];
    updatedColors[colorIndex].images = updatedColors[colorIndex].images.filter(
      (_, i) => i !== imageIndex
    );
    setColors(updatedColors);
  };

  const addTag = (tag?: string) => {
    const tagToAdd = tag || newTag;
    if (tagToAdd && !tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
      if (!tag) {
        setNewTag("");
      }
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addCustomSize = () => {
    if (newSizeInput && !customSizes.includes(newSizeInput)) {
      setCustomSizes([...customSizes, newSizeInput]);
      setSizeStocks({ ...sizeStocks, [newSizeInput]: 0 });
      setNewSizeInput("");
    }
  };

  const removeCustomSize = (size: string) => {
    setCustomSizes(customSizes.filter((s) => s !== size));
    const newStocks = { ...sizeStocks };
    delete newStocks[size];
    setSizeStocks(newStocks);
  };

  const loadTemplates = async () => {
    try {
      const [wash, delivery, notes, guides, models] = await Promise.all([
        fetch("/api/admin/washing-instructions").then(r => r.json()),
        fetch("/api/admin/delivery-info").then(r => r.json()),
        fetch("/api/admin/size-notes").then(r => r.json()),
        fetch("/api/admin/size-guides").then(r => r.json()),
        fetch("/api/admin/model-info").then(r => r.json()),
      ]);
      setWashingInstructions(wash);
      setDeliveryInfos(delivery);
      setSizeNotes(notes);
      setSizeGuides(guides);
      setModelInfos(models);
    } catch (error) {
      console.error("Template'ler yüklenirken hata:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
    }
  };

  const loadProductData = async () => {
    if (!productId) return;
    setLoadingData(true);
    try {
      const res = await fetch(`/api/admin-products/${productId}`);
      if (res.ok) {
        const product = await res.json();

        setName(product.name || "");
        setStockCode(product.stockCode || "");
        setDescription(product.description || "");
        setPrice(product.price?.toString() || "");
        setOriginalPrice(product.originalPrice?.toString() || "");
        setGender(product.gender || "");
        setFabricType(product.fabricType || "");
        setWeight(product.weight?.toString() || "");
        setBrand(product.brand || "");
        setDetailText(product.detailText || "");
        setWashingInstructionId(product.washingInstructionId || "");
        setDeliveryInfoId(product.deliveryInfoId || "");
        setSizeNoteId(product.sizeNoteId || "");
        setSizeGuideId(product.sizeGuideId || "");
        setModelInfoId(product.modelInfoId || "");
        setSelectedCategoryId(product.categoryId || "");

        const images: string[] = [];
        if (product.image) images.push(product.image);
        if (product.primaryImage && !images.includes(product.primaryImage)) images.push(product.primaryImage);
        if (product.secondaryImage && !images.includes(product.secondaryImage)) images.push(product.secondaryImage);
        setUploadedImages(images);
        setPrimaryImage(product.primaryImage || product.image || "");
        setSecondaryImage(product.secondaryImage || "");

        if (product.colors && product.colors.length > 0) {
          const stocksByColor = new Map<string, Record<string, number>>();
          const sizesByColor = new Map<string, Set<string>>();
          const pricesByColor = new Map<string, number>();

          if (Array.isArray(product.variants)) {
            for (const variant of product.variants) {
              const colorName = variant?.color?.name;
              const sizeName = variant?.size?.name;
              if (!colorName) continue;

              if (!stocksByColor.has(colorName)) {
                stocksByColor.set(colorName, {});
              }
              if (!sizesByColor.has(colorName)) {
                sizesByColor.set(colorName, new Set<string>());
              }

              if (sizeName) {
                const normalizedSize = normalizeSizeName(sizeName);
                stocksByColor.get(colorName)![normalizedSize] = Number(variant.stock) || 0;
                sizesByColor.get(colorName)!.add(normalizedSize);
              }

              if (!pricesByColor.has(colorName) && typeof variant.price === "number" && !Number.isNaN(variant.price)) {
                pricesByColor.set(colorName, variant.price);
              }
            }
          }

          const loadedColors: Color[] = product.colors.map((c: any) => {
            let colorImages: string[] = [];
            if (c.images) {
              if (typeof c.images === 'string') {
                try {
                  colorImages = JSON.parse(c.images);
                } catch {
                  colorImages = [c.images];
                }
              } else if (Array.isArray(c.images)) {
                colorImages = c.images;
              }
            }

            return {
              name: c.name,
              hexCode: c.hexCode,
              images: colorImages,
              useMainPrice: !pricesByColor.has(c.name),
              price: pricesByColor.has(c.name) ? String(pricesByColor.get(c.name)) : "",
              originalPrice: "",
              stock: stocksByColor.get(c.name) || {},
              sizes: Array.from(sizesByColor.get(c.name) || []),
            };
          });

          if (loadedColors.length > 0) {
            setPrimaryProductColor(loadedColors[0]);
            setColors(loadedColors.slice(1));
          }
        }

        if (product.sizes && product.sizes.length > 0) {
          const sizeNames = product.sizes
            .map((s: any) => normalizeSizeName(s.name))
            .filter(Boolean);

          const resolvedSizeType: "LETTER" | "NUMBER" | "CUP" = product.sizeType || inferSizeTypeFromNames(sizeNames);
          setSizeType(resolvedSizeType);
          setCustomSizes(sizeNames);

          const stocks: { [key: string]: number } = {};
          product.sizes.forEach((s: any) => {
            const normalizedName = normalizeSizeName(s.name);
            stocks[normalizedName] = s.stock || 0;
          });
          setSizeStocks(stocks);
        } else {
          const fallbackSizesFromVariants: string[] = Array.from(
            new Set<string>(
              (product.variants || [])
                .map((v: any) => normalizeSizeName(v?.size?.name || ""))
                .filter((name): name is string => Boolean(name))
            )
          );

          if (fallbackSizesFromVariants.length > 0) {
            const resolvedSizeType: "LETTER" | "NUMBER" | "CUP" = product.sizeType || inferSizeTypeFromNames(fallbackSizesFromVariants);
            setSizeType(resolvedSizeType);
            setCustomSizes(fallbackSizesFromVariants);
            const stocks: { [key: string]: number } = {};
            for (const variant of product.variants || []) {
              const normalizedName = normalizeSizeName(variant?.size?.name || "");
              if (!normalizedName) continue;
              stocks[normalizedName] = (stocks[normalizedName] || 0) + (Number(variant?.stock) || 0);
            }
            setSizeStocks(stocks);
          } else {
            setSizeType(product.sizeType || "LETTER");
          }
        }

        if (product.tags && product.tags.length > 0) {
          setTags(product.tags.map((t: any) => t.name));
        }

      }
    } catch (error) {
      console.error("Ürün verisi yüklenirken hata:", error);
      toast.error("Ürün verisi yüklenirken bir hata oluştu");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadTemplates();
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const handleSubmit = async () => {
    if (!name || !price) {
      toast.error("Lütfen ürün adı ve fiyat bilgilerini girin");
      return;
    }

    setLoading(true);

    try {
      const categoryName = categories.find(c => c.id === selectedCategoryId)?.name;
      const firstColorName = primaryProductColor?.name || colors[0]?.name;
      const autoSlug = generateProductSlug(name, categoryName, firstColorName);

      const productData = {
        name,
        slug: autoSlug,
        stockCode: stockCode || undefined,
        description: description || undefined,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        primaryImage: primaryImage || undefined,
        secondaryImage: secondaryImage || undefined,
        image: primaryImage || undefined,
        gender: gender || undefined,
        sizeType: sizeType,
        fabricType: fabricType || undefined,
        isActive: true,
        sizes: customSizes.map((size) => ({
          name: size,
          stock: sizeStocks[size] || 0,
        })),
        tags: tags.map((t) => ({ name: t })),
        sizeOptions: customSizes.map((s) => ({ name: s })),
        categoryId: selectedCategoryId || undefined,
        brand: brand || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        detailText: await processHtmlImages(detailText) || undefined,
        washingInstructionId: washingInstructionId || undefined,
        deliveryInfoId: deliveryInfoId || undefined,
        sizeNoteId: sizeNoteId || undefined,
        sizeGuideId: sizeGuideId || undefined,
        modelInfoId: modelInfoId || undefined,
        colors: [
          ...(primaryProductColor ? [{
            name: primaryProductColor.name,
            hexCode: primaryProductColor.hexCode,
            images: primaryProductColor.images,
          }] : []),
          ...colors.map((c) => {
            const finalPrice = c.useMainPrice
              ? parseFloat(price)
              : c.price && parseFloat(c.price) > 0
                ? parseFloat(c.price)
                : parseFloat(price);

            const finalOriginalPrice = c.originalPrice && parseFloat(c.originalPrice) > 0 && c.price && parseFloat(c.price) > 0 && parseFloat(c.originalPrice) > parseFloat(c.price)
              ? parseFloat(c.price)
              : undefined;

            return {
              name: c.name,
              hexCode: c.hexCode,
              images: c.images,
              price: finalPrice !== parseFloat(price) ? finalPrice : undefined,
              originalPrice: finalOriginalPrice,
              sizeStocks: c.stock || {},
            };
          }),
        ],
      };

      let finalPrimaryImage = primaryImage;
      let finalSecondaryImage = secondaryImage;

      if (primaryImage?.startsWith("data:image")) {
        const url = await uploadBase64ToCloudinary(primaryImage);
        if (!url) throw new Error("Ana görsel yüklenemedi");
        finalPrimaryImage = url;
      }
      if (secondaryImage?.startsWith("data:image")) {
        const url = await uploadBase64ToCloudinary(secondaryImage);
        if (!url) throw new Error("Hover görseli yüklenemedi");
        finalSecondaryImage = url;
      }

      const processColorImages = async (colorImages: string[]) => {
        return Promise.all(
          colorImages.map(async (img: string) => {
            if (img.startsWith("data:image")) {
              const url = await uploadBase64ToCloudinary(img);
              if (!url) throw new Error("Renk görseli yüklenemedi");
              return url;
            }
            return img;
          })
        );
      };

      const processedPrimaryColor = primaryProductColor
        ? {
          ...primaryProductColor,
          images: await processColorImages(primaryProductColor.images),
        }
        : null;

      const processedColors = await Promise.all(
        colors.map(async (c) => ({
          ...c,
          images: await processColorImages(c.images),
        }))
      );

      productData.primaryImage = finalPrimaryImage || undefined;
      productData.secondaryImage = finalSecondaryImage || undefined;
      productData.image = finalPrimaryImage || undefined;
      productData.colors = [
        ...(processedPrimaryColor ? [{
          name: processedPrimaryColor.name,
          hexCode: processedPrimaryColor.hexCode,
          images: processedPrimaryColor.images.filter((img): img is string => !!img),
        }] : []),
        ...processedColors.map((c) => {
          const finalPrice = c.useMainPrice
            ? parseFloat(price)
            : c.price && parseFloat(c.price) > 0
              ? parseFloat(c.price)
              : parseFloat(price);

          const finalOriginalPrice = c.originalPrice && parseFloat(c.originalPrice) > 0 && c.price && parseFloat(c.price) > 0 && parseFloat(c.originalPrice) > parseFloat(c.price)
            ? parseFloat(c.price)
            : undefined;

          const colorSizes = c.sizes && c.sizes.length > 0 ? c.sizes : customSizes;

          return {
            name: c.name,
            hexCode: c.hexCode,
            images: c.images.filter((img): img is string => !!img),
            price: finalPrice !== parseFloat(price) ? finalPrice : undefined,
            originalPrice: finalOriginalPrice,
            sizeStocks: c.stock || {},
            sizes: colorSizes, // Renge özel bedenler
          };
        }),
      ];

      const res = await fetch(`/api/admin-products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        toast.success("Ürün başarıyla güncellendi");
        router.push("/admin-products");
      } else {
        const error = await res.json();
        toast.error(error.error || "Ürün güncellenirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Hata:", error);
      toast.error("Ürün güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Ürün Düzenle</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Ürün Önizlemesi</h2>

              
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                  ? "border-black bg-gray-50"
                  : "border-gray-300 hover:border-gray-400"
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(e.target.files);
                    }
                  }}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900 mb-2">
                      Fotoğrafı buraya sürükleyin
                    </p>
                    <p className="text-sm text-gray-500 mb-3">veya</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Dosya Seç
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF formatları desteklenir
                  </p>
                </div>
              </div>

              
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <Label className="text-sm font-medium mb-3 block">Yüklenen Görseller</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        <Image
                          src={img}
                          alt={`Görsel ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  
                  <div className="mt-6 space-y-4 pt-6 border-t border-gray-200">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Ana Görsel</Label>
                      <RadioGroup
                        value={primaryImage}
                        onValueChange={(value) => {
                          setPrimaryImage(value);
                          if (secondaryImage === value) {
                            setSecondaryImage("");
                          }
                        }}
                        className="grid grid-cols-4 gap-3"
                      >
                        {uploadedImages.map((img, index) => {
                          const isHover = secondaryImage === img;
                          return (
                            <div key={index} className="flex flex-col items-center gap-2">
                              <div className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 ${isHover ? "border-gray-300 opacity-50" : "border-gray-200"
                                }`}>
                                <Image
                                  src={img}
                                  alt={`Ana görsel ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                {primaryImage === img && (
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <div className="bg-black text-white text-xs px-2 py-1 rounded">
                                      Ana
                                    </div>
                                  </div>
                                )}
                                {isHover && (
                                  <div className="absolute inset-0 bg-gray-400/30 flex items-center justify-center">
                                    <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                                      Hover
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value={img}
                                  id={`primary-${index}`}
                                  disabled={isHover}
                                />
                                <Label
                                  htmlFor={`primary-${index}`}
                                  className={`text-xs cursor-pointer ${isHover ? "text-gray-400" : "text-gray-600"
                                    }`}
                                >
                                  Ana Görsel
                                </Label>
                              </div>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Hover Görseli</Label>
                      <RadioGroup
                        value={secondaryImage}
                        onValueChange={(value) => {
                          setSecondaryImage(value);
                          if (primaryImage === value) {
                            setPrimaryImage("");
                          }
                        }}
                        className="grid grid-cols-4 gap-3"
                      >
                        {uploadedImages.map((img, index) => {
                          const isPrimary = primaryImage === img;
                          return (
                            <div key={index} className="flex flex-col items-center gap-2">
                              <div className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 ${isPrimary ? "border-gray-300 opacity-50" : "border-gray-200"
                                }`}>
                                <Image
                                  src={img}
                                  alt={`Hover görseli ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                {secondaryImage === img && (
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <div className="bg-black text-white text-xs px-2 py-1 rounded">
                                      Hover
                                    </div>
                                  </div>
                                )}
                                {isPrimary && (
                                  <div className="absolute inset-0 bg-gray-400/30 flex items-center justify-center">
                                    <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                                      Ana
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value={img}
                                  id={`secondary-${index}`}
                                  disabled={isPrimary}
                                />
                                <Label
                                  htmlFor={`secondary-${index}`}
                                  className={`text-xs cursor-pointer ${isPrimary ? "text-gray-400" : "text-gray-600"
                                    }`}
                                >
                                  Hover Görseli
                                </Label>
                              </div>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              
              {name && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-lg mb-2">{name}</h3>
                  {price && (
                    <p className="text-2xl font-bold text-gray-900">
                      {parseFloat(price).toFixed(2)} ₺
                      {originalPrice && parseFloat(originalPrice) > parseFloat(price) && (
                        <span className="ml-2 text-lg text-gray-500 line-through">
                          {parseFloat(originalPrice).toFixed(2)} ₺
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Ürün Bilgileri</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Ürün Adı *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ürün adını girin"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="brand">Marka</Label>
                    <Input
                      id="brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Marka"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Ağırlık</Label>
                    <Input
                      id="weight"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="kg"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Cinsiyet</Label>
                    <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                      <SelectTrigger className="mt-1">
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

                <div>
                  <Label htmlFor="fabricType">Kumaş Tipi</Label>
                  <Input
                    id="fabricType"
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    placeholder="Örn: Pamuk, Polyester"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Kısa Açıklama</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ürün açıklaması"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="detailText">Detaylı Açıklama</Label>
                  <Textarea
                    id="detailText"
                    value={detailText}
                    onChange={(e) => setDetailText(e.target.value)}
                    placeholder="Detaylı ürün açıklaması (HTML olabilir)"
                    rows={6}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Ana Ürün Rengi</h2>

              {!primaryProductColor ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Renk adı"
                      value={primaryProductColorName}
                      onChange={(e) => setPrimaryProductColorName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addPrimaryProductColor}
                      disabled={!primaryProductColorName}
                      size="sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && primaryProductColorName) {
                          e.preventDefault();
                          addPrimaryProductColor();
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{primaryProductColor.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimaryProductColor(null)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Beden</h2>

              
              <div className="mb-4">
                <Label className="text-sm font-medium mb-3 block">Beden Tipi</Label>
                <RadioGroup value={sizeType} onValueChange={(v: any) => {
                  setSizeType(v);
                  setCustomSizes([]);
                  setSizeStocks({});
                }}>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="LETTER" id="size-letter" />
                      <Label htmlFor="size-letter" className="cursor-pointer">Harf (XS, S, M, L, XL)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NUMBER" id="size-number" />
                      <Label htmlFor="size-number" className="cursor-pointer">Sayı (30, 32, 34, 36)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CUP" id="size-cup" />
                      <Label htmlFor="size-cup" className="cursor-pointer">Beden (80B, 85C, 90D)</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              
              {sizeType === "LETTER" && (
                <div className="flex flex-wrap gap-3">
                  {letterSizes.map((size) => (
                    <div key={size} className="flex items-center gap-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={customSizes.includes(size)}
                        onCheckedChange={() => {
                          if (customSizes.includes(size)) {
                            removeCustomSize(size);
                          } else {
                            setCustomSizes([...customSizes, size]);
                            setSizeStocks({ ...sizeStocks, [size]: 0 });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`size-${size}`}
                        className="cursor-pointer font-normal"
                      >
                        {size}
                      </Label>
                      {customSizes.includes(size) && (
                        <Input
                          type="number"
                          value={sizeStocks[size] || 0}
                          onChange={(e) =>
                            setSizeStocks({
                              ...sizeStocks,
                              [size]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 h-8 ml-2"
                          placeholder="Stok"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              
              {sizeType === "NUMBER" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {numberSizes.map((size) => (
                      <div key={size} className="flex items-center gap-2">
                        <Checkbox
                          id={`size-${size}`}
                          checked={customSizes.includes(size)}
                          onCheckedChange={() => {
                            if (customSizes.includes(size)) {
                              removeCustomSize(size);
                            } else {
                              setCustomSizes([...customSizes, size]);
                              setSizeStocks({ ...sizeStocks, [size]: 0 });
                            }
                          }}
                        />
                        <Label
                          htmlFor={`size-${size}`}
                          className="cursor-pointer font-normal"
                        >
                          {size}
                        </Label>
                        {customSizes.includes(size) && (
                          <Input
                            type="number"
                            value={sizeStocks[size] || 0}
                            onChange={(e) =>
                              setSizeStocks({
                                ...sizeStocks,
                                [size]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 h-8 ml-2"
                            placeholder="Stok"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
              {sizeType === "CUP" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Örn: 80B, 85C, 90D"
                      value={newSizeInput}
                      onChange={(e) => setNewSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSize();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addCustomSize}
                      disabled={!newSizeInput}
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {customSizes.map((size) => (
                      <div key={size} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                        <span className="font-medium">{size}</span>
                        <Input
                          type="number"
                          value={sizeStocks[size] || 0}
                          onChange={(e) =>
                            setSizeStocks({
                              ...sizeStocks,
                              [size]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 h-8"
                          placeholder="Stok"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomSize(size)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Renk</h2>

              
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Renk adı"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newColorName) {
                      e.preventDefault();
                      addColor();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addColor}
                  disabled={!newColorName}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              
              <div className="space-y-4">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${selectedColor === index
                      ? "border-black bg-gray-50"
                      : "border-gray-200"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{color.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedColor(selectedColor === index ? null : index)
                          }
                        >
                          {selectedColor === index ? "Seçili" : "Seç"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColor(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    
                    {selectedColor === index && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Label className="text-sm font-medium mb-2 block">
                          Bu renge özel görseller
                        </Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Görsel URL"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const input = e.target as HTMLInputElement;
                                  if (input.value) {
                                    addColorImage(index, input.value);
                                    input.value = "";
                                  }
                                }
                              }}
                              className="flex-1"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              id={`color-image-upload-${index}`}
                              onChange={(e) => {
                                if (e.target.files) {
                                  handleColorImageFiles(index, e.target.files);
                                }
                                e.target.value = ""; // Reset input
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                document.getElementById(`color-image-upload-${index}`)?.click();
                              }}
                              className="whitespace-nowrap"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Fotoğraf Ekle
                            </Button>
                          </div>
                          {color.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {color.images.map((img, imgIndex) => (
                                <div key={imgIndex} className="relative aspect-square rounded overflow-hidden border border-gray-200">
                                  <Image
                                    src={img}
                                    alt={`${color.name} ${imgIndex + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeColorImage(index, imgIndex)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Label className="text-sm font-medium mb-3 block">
                            Fiyatlandırma
                          </Label>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`color-use-main-price-${index}`}
                                checked={color.useMainPrice ?? true}
                                onCheckedChange={(checked) =>
                                  updateColorPrice(index, "useMainPrice", checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`color-use-main-price-${index}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                Ana ürünle aynı fiyat
                              </Label>
                            </div>

                            {!color.useMainPrice && (
                              <div className="space-y-3 pl-6">
                                <div>
                                  <Label className="text-xs text-gray-600 mb-1 block">
                                    Fiyat
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={color.price || ""}
                                    onChange={(e) =>
                                      updateColorPrice(index, "price", e.target.value)
                                    }
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600 mb-1 block">
                                    İndirimli Fiyat
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={color.originalPrice || ""}
                                    onChange={(e) =>
                                      updateColorPrice(index, "originalPrice", e.target.value)
                                    }
                                    className="w-full"
                                  />
                                  {color.originalPrice && color.price && parseFloat(color.originalPrice) > parseFloat(color.price) && (
                                    <p className="text-xs text-green-600 mt-1">
                                      İndirim: %{Math.round(((parseFloat(color.originalPrice) - parseFloat(color.price)) / parseFloat(color.originalPrice)) * 100)}
                                    </p>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  {color.originalPrice && color.price && parseFloat(color.originalPrice) > 0 && parseFloat(color.price) > 0
                                    ? `Görünen fiyat: ${parseFloat(color.price).toFixed(2)} ₺ (İndirimli: ${parseFloat(color.originalPrice).toFixed(2)} ₺)`
                                    : color.price && parseFloat(color.price) > 0
                                      ? `Görünen fiyat: ${parseFloat(color.price).toFixed(2)} ₺`
                                      : "Fiyat giriniz"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Label className="text-sm font-medium mb-3 block">
                            Bu Renk İçin Bedenler
                          </Label>
                          <div className="text-xs text-gray-500 mb-3">
                            Üstte seçilen bedenler otomatik gelir. İsterseniz bu renk için farklı bedenler seçebilirsiniz.
                          </div>

                          
                          <div className="mb-3">
                            <Label className="text-xs font-medium mb-2 block">Beden Tipi</Label>
                            <RadioGroup
                              value={sizeType}
                              onValueChange={(v: any) => {
                                const updatedColors = [...colors];
                                updatedColors[index].sizes = [];
                                setColors(updatedColors);
                              }}
                            >
                              <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="LETTER" id={`color-${index}-letter`} />
                                  <Label htmlFor={`color-${index}-letter`} className="cursor-pointer text-xs">Harf</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="NUMBER" id={`color-${index}-number`} />
                                  <Label htmlFor={`color-${index}-number`} className="cursor-pointer text-xs">Sayı</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="CUP" id={`color-${index}-cup`} />
                                  <Label htmlFor={`color-${index}-cup`} className="cursor-pointer text-xs">Beden</Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>

                          
                          {sizeType === "LETTER" && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {letterSizes.map((size) => (
                                <div key={size} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`color-${index}-size-${size}`}
                                    checked={color.sizes?.includes(size) || false}
                                    onCheckedChange={(checked) => {
                                      const updatedColors = [...colors];
                                      if (!updatedColors[index].sizes) {
                                        updatedColors[index].sizes = [];
                                      }
                                      if (checked) {
                                        if (!updatedColors[index].sizes!.includes(size)) {
                                          updatedColors[index].sizes!.push(size);
                                        }
                                        if (!updatedColors[index].stock) {
                                          updatedColors[index].stock = {};
                                        }
                                        if (!(size in updatedColors[index].stock!)) {
                                          updatedColors[index].stock![size] = 0;
                                        }
                                      } else {
                                        updatedColors[index].sizes = updatedColors[index].sizes!.filter(s => s !== size);
                                        if (updatedColors[index].stock) {
                                          delete updatedColors[index].stock![size];
                                        }
                                      }
                                      setColors(updatedColors);
                                    }}
                                  />
                                  <Label
                                    htmlFor={`color-${index}-size-${size}`}
                                    className="cursor-pointer font-normal text-xs"
                                  >
                                    {size}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}

                          
                          {sizeType === "NUMBER" && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {numberSizes.map((size) => (
                                <div key={size} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`color-${index}-size-${size}`}
                                    checked={color.sizes?.includes(size) || false}
                                    onCheckedChange={(checked) => {
                                      const updatedColors = [...colors];
                                      if (!updatedColors[index].sizes) {
                                        updatedColors[index].sizes = [];
                                      }
                                      if (checked) {
                                        if (!updatedColors[index].sizes!.includes(size)) {
                                          updatedColors[index].sizes!.push(size);
                                        }
                                        if (!updatedColors[index].stock) {
                                          updatedColors[index].stock = {};
                                        }
                                        if (!(size in updatedColors[index].stock!)) {
                                          updatedColors[index].stock![size] = 0;
                                        }
                                      } else {
                                        updatedColors[index].sizes = updatedColors[index].sizes!.filter(s => s !== size);
                                        if (updatedColors[index].stock) {
                                          delete updatedColors[index].stock![size];
                                        }
                                      }
                                      setColors(updatedColors);
                                    }}
                                  />
                                  <Label
                                    htmlFor={`color-${index}-size-${size}`}
                                    className="cursor-pointer font-normal text-xs"
                                  >
                                    {size}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}

                          
                          {sizeType === "CUP" && (
                            <div className="space-y-2 mb-3">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Örn: 80B, 85C, 90D"
                                  value={newSizeInput}
                                  onChange={(e) => setNewSizeInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const size = newSizeInput.trim();
                                      if (size && !color.sizes?.includes(size)) {
                                        const updatedColors = [...colors];
                                        if (!updatedColors[index].sizes) {
                                          updatedColors[index].sizes = [];
                                        }
                                        updatedColors[index].sizes!.push(size);
                                        if (!updatedColors[index].stock) {
                                          updatedColors[index].stock = {};
                                        }
                                        updatedColors[index].stock![size] = 0;
                                        setColors(updatedColors);
                                        setNewSizeInput("");
                                      }
                                    }
                                  }}
                                  className="flex-1 text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const size = newSizeInput.trim();
                                    if (size && !color.sizes?.includes(size)) {
                                      const updatedColors = [...colors];
                                      if (!updatedColors[index].sizes) {
                                        updatedColors[index].sizes = [];
                                      }
                                      updatedColors[index].sizes!.push(size);
                                      if (!updatedColors[index].stock) {
                                        updatedColors[index].stock = {};
                                      }
                                      updatedColors[index].stock![size] = 0;
                                      setColors(updatedColors);
                                      setNewSizeInput("");
                                    }
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              {color.sizes && color.sizes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {color.sizes.map((size) => (
                                    <div key={size} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                      <span>{size}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedColors = [...colors];
                                          updatedColors[index].sizes = updatedColors[index].sizes!.filter(s => s !== size);
                                          if (updatedColors[index].stock) {
                                            delete updatedColors[index].stock![size];
                                          }
                                          setColors(updatedColors);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          
                          {color.sizes && color.sizes.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <Label className="text-sm font-medium mb-3 block">
                                Stok Yönetimi
                              </Label>
                              <div className="grid grid-cols-3 gap-3">
                                {color.sizes.map((size) => (
                                  <div key={size}>
                                    <Label className="text-xs text-gray-600 mb-1 block">
                                      {size}
                                    </Label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={color.stock?.[size] || 0}
                                      onChange={(e) =>
                                        updateColorStock(index, size, parseInt(e.target.value) || 0)
                                      }
                                      className="w-full"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Fiyatlandırma</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Fiyat *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">İndirimli Fiyat</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                  {originalPrice && price && parseFloat(originalPrice) > parseFloat(price) && (
                    <p className="text-sm text-green-600 mt-1">
                      İndirim: %{Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Etiketler</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tags">Etiket Ekle</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Etiket ekle"
                    />
                    <Button type="button" onClick={() => addTag()} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Önerilen Etiketler</Label>
                  <div className="flex flex-wrap gap-2">
                    {tagSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addTag(suggestion)}
                        disabled={tags.includes(suggestion)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${tags.includes(suggestion)
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300"
                          : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                          }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                
                {tags.length > 0 && (
                  <div>
                    <Label className="text-sm text-gray-600 mb-2 block">Eklenen Etiketler</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Ürün Detay Şablonları</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="washingInstruction">Yıkama Talimatı</Label>
                  <div className="flex gap-2">
                    <Select value={washingInstructionId} onValueChange={setWashingInstructionId}>
                      <SelectTrigger className="mt-1 flex-1">
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Seçim Yok</SelectItem>
                        {washingInstructions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1"
                      onClick={() => setWashingModalOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryInfo">Teslimat ve İade Bilgisi</Label>
                  <div className="flex gap-2">
                    <Select value={deliveryInfoId} onValueChange={setDeliveryInfoId}>
                      <SelectTrigger className="mt-1 flex-1">
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Seçim Yok</SelectItem>
                        {deliveryInfos.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1"
                      onClick={() => setDeliveryModalOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sizeNote">Beden Notu</Label>
                  <div className="flex gap-2">
                    <Select value={sizeNoteId} onValueChange={setSizeNoteId}>
                      <SelectTrigger className="mt-1 flex-1">
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Seçim Yok</SelectItem>
                        {sizeNotes.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1"
                      onClick={() => setSizeNoteModalOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sizeGuide">Beden Rehberi</Label>
                  <div className="flex gap-2">
                    <Select value={sizeGuideId} onValueChange={setSizeGuideId}>
                      <SelectTrigger className="mt-1 flex-1">
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Seçim Yok</SelectItem>
                        {sizeGuides.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1"
                      onClick={() => setSizeGuideModalOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="modelInfo">Model Bilgisi</Label>
                  <div className="flex gap-2">
                    <Select value={modelInfoId} onValueChange={setModelInfoId}>
                      <SelectTrigger className="mt-1 flex-1">
                        <SelectValue placeholder="Seçiniz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Seçim Yok</SelectItem>
                        {modelInfos.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1"
                      onClick={() => setModelInfoModalOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            
            <WashingInstructionModal
              open={washingModalOpen}
              onOpenChange={setWashingModalOpen}
              onSuccess={loadTemplates}
            />
            <DeliveryInfoModal
              open={deliveryModalOpen}
              onOpenChange={setDeliveryModalOpen}
              onSuccess={loadTemplates}
            />
            <SizeNoteModal
              open={sizeNoteModalOpen}
              onOpenChange={setSizeNoteModalOpen}
              onSuccess={loadTemplates}
            />
            <SizeGuideModal
              open={sizeGuideModalOpen}
              onOpenChange={setSizeGuideModalOpen}
              onSuccess={loadTemplates}
            />
            <ModelInfoModal
              open={modelInfoModalOpen}
              onOpenChange={setModelInfoModalOpen}
              onSuccess={loadTemplates}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
