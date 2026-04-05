"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

import { ProductInfo } from "./components/ProductInfo";
import { ProductPricingInventory } from "./components/ProductPricingInventory";
import { ProductMedia } from "./components/ProductMedia";
import { ProductVariants, Color } from "./components/ProductVariants";
import { ProductSizeStock, SizeType, SIZE_OPTIONS } from "./components/ProductSizeStock";
import { ProductSidebar } from "./components/ProductSidebar";

import { generateProductSlug } from "@/lib/slug";
import { productSchema, type ProductFormValues } from "./schema";
import { uploadFileToCloudinary } from "@/lib/cloudinary";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin-categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
        toast.error("Kategoriler yÃ¼klenemedi");
      }
    }
    fetchCategories();
  }, []);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      originalPrice: 0,
      sku: "",
      barcode: "",
      isTrackInventory: true,
      allowBackorders: false,
      isTaxable: true,
      isVariable: false,
      sizeType: "letter" as SizeType,
      status: "draft",
      tags: [],
      uploadedImages: [],
      variants: [],
      primaryImage: "",
      secondaryImage: "",
      simpleStock: {},
      mainColorName: "",
      mainColorHex: "",
    },
    mode: "onChange",
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = methods;

  const name = watch("name");
  const isVariable = watch("isVariable");
  const sizeType = watch("sizeType");
  const uploadedImages = watch("uploadedImages");
  const colors = watch("variants"); // Mapped to variants in schema but UI thinks 'colors'
  const brand = watch("brand");
  const slug = watch("slug");

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugSuffix] = useState(() => Math.random().toString(36).substring(2, 8));

  useEffect(() => {
    if (!name || isSlugManuallyEdited) return;
    const baseSlug = generateProductSlug(name);
    setValue("slug", `${baseSlug}-${slugSuffix}`);
    setValue("seoTitle", `${name} - ${brand || "MaÄŸaza"}`);
  }, [name, brand, isSlugManuallyEdited, slugSuffix, setValue]);


  const handleMediaUpload = (files: FileList) => {
    const newUrls: string[] = [];
    const newMap = new Map(fileMap);

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
      newMap.set(url, file);
    });

    setFileMap(newMap);
    const currentImages = watch("uploadedImages") || [];
    const updatedImages = [...currentImages, ...newUrls];

    setValue("uploadedImages", updatedImages);

    if (!watch("primaryImage") && updatedImages.length > 0) {
      setValue("primaryImage", updatedImages[0]);
    }
    if (!watch("secondaryImage") && updatedImages.length > 1) {
      setValue("secondaryImage", updatedImages[1]);
    }

    toast.success(`${newUrls.length} gÃ¶rsel eklendi`);
  };

  const handleColorImageUpload = (files: FileList, colorIndex: number) => {
    const currentVariants = watch("variants") || [];
    const variant = currentVariants[colorIndex];
    const newUrls: string[] = [];
    const newMap = new Map(fileMap);

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
      newMap.set(url, file);
    });
    setFileMap(newMap);

    const updatedVariant = {
      ...variant,
      images: [...(variant.images || []), ...newUrls]
    };

    const newVariants = [...currentVariants];
    newVariants[colorIndex] = updatedVariant;
    setValue("variants", newVariants);

    toast.success("Varyant gÃ¶rselleri gÃ¼ncellendi");
  };

  const processImageUpload = async (url: string): Promise<string> => {
    if (!url) return "";

    if (url.startsWith("blob:")) {
      if (fileMap.has(url)) {
        const file = fileMap.get(url)!;
        const uploadedUrl = await uploadFileToCloudinary(file);
        if (!uploadedUrl) throw new Error("GÃ¶rsel yÃ¼klenemedi (Upload failed)");
        return uploadedUrl;
      } else {
        throw new Error("GÃ¶rsel bulunamadÄ± (File map miss). LÃ¼tfen sayfayÄ± yenileyip tekrar deneyin.");
      }
    }
    return url; // Already a remote URL
  };

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    const toastId = toast.loading("ÃœrÃ¼n oluÅŸturuluyor & gÃ¶rseller yÃ¼kleniyor...");

    try {
      const processedImages: string[] = [];
      for (const imgResult of data.uploadedImages) {
        const realUrl = await processImageUpload(imgResult);
        processedImages.push(realUrl);
      }

      const realPrimary = await processImageUpload(data.primaryImage || "");
      const realSecondary = await processImageUpload(data.secondaryImage || "");

      const processedVariants = await Promise.all((data.variants || []).map(async (v) => {
        const vImages = await Promise.all(v.images.map(img => processImageUpload(img)));
        return {
          ...v,
          images: vImages
        };
      }));

      const payload = {
        ...data,
        uploadedImages: processedImages,
        primaryImage: realPrimary || (processedImages.length > 0 ? processedImages[0] : null),
        secondaryImage: realSecondary || (processedImages.length > 1 ? processedImages[1] : null),
        colors: data.isVariable ? processedVariants.map(v => ({
          name: v.colorName,
          hexCode: v.hexCode,
          images: v.images,
          sizes: SIZE_OPTIONS[data.sizeType], // Use default full list or potentially filtered
          stock: v.stock,
          sizeStocks: v.stock
        })) :
          (data.mainColorName && data.mainColorHex) ? [{
            name: data.mainColorName,
            hexCode: data.mainColorHex,
            images: [], // or use primary/secondary if we want to link them specific to this color
            sizes: Object.keys(data.simpleStock || {}),
            stock: data.simpleStock,
            sizeStocks: data.simpleStock
          }] : [],
        sizes: !data.isVariable
          ? Object.entries(data.simpleStock || {}).map(([name, stock]) => ({ name, stock }))
          : [],
        stockCode: data.sku,
        image: realPrimary || (processedImages.length > 0 ? processedImages[0] : null), // Legacy field
        price: Number(data.price),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
        isActive: data.status === 'published',
      };

      const res = await fetch("/api/admin-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Sunucu hatasÄ±");
      }

      toast.dismiss(toastId);
      toast.success("ÃœrÃ¼n baÅŸarÄ±yla yayÄ±nlandÄ±!");
      router.push("/admin-products");

    } catch (error: any) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <FormProvider {...methods}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Yeni ÃœrÃ¼n Ekle</h1>
              <p className="text-xs text-gray-500 mt-1">{isVariable ? "VaryantlÄ± ÃœrÃ¼n" : "Tekil ÃœrÃ¼n"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="text-gray-600 border-gray-300" onClick={() => toast.info("Taslak (frontend only) kaydedildi")}>
              TaslaÄŸÄ± Kaydet
            </Button>
            <Button
              onClick={handleSubmit(onSubmit, (invalid) => {
                console.log("Validation Errors:", invalid);
                toast.error("LÃ¼tfen formdaki hatalarÄ± giderin.");
              })}
              disabled={loading}
              className="bg-gray-900 text-white hover:bg-black shadow-md transition-all active:scale-95"
            >
              {loading ? "GÃ¶rseller YÃ¼kleniyor..." : "ÃœrÃ¼nÃ¼ YayÄ±nla"}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1600px] mx-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN - FORM COMPONENTS */}
            <div className="lg:col-span-8 space-y-8">

              {/* 1. Basic Info */}
              <ProductInfo
                name={watch("name")}
                setName={(val) => setValue("name", val)}
                description={watch("description") || ""}
                setDescription={(val) => setValue("description", val)}
                gender={watch("gender")}
                setGender={(val) => setValue("gender", val)}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

              {/* 2. Media */}
              <ProductMedia
                uploadedImages={watch("uploadedImages") || []}
                primaryImage={watch("primaryImage") || ""}
                setPrimaryImage={(val) => setValue("primaryImage", val)}
                secondaryImage={watch("secondaryImage") || ""}
                setSecondaryImage={(val) => setValue("secondaryImage", val)}
                onFilesSelected={handleMediaUpload}
                onRemoveImage={(idx) => {
                  const current = watch("uploadedImages");
                  const updated = current.filter((_, i) => i !== idx);
                  setValue("uploadedImages", updated);
                }}
              />

              {/* 3. Pricing */}
              <ProductPricingInventory
                price={String(watch("price"))} setPrice={(val) => setValue("price", Number(val))}
                originalPrice={String(watch("originalPrice") || "")} setOriginalPrice={(val) => setValue("originalPrice", Number(val))}
                sku={watch("sku") || ""} setSku={(val) => setValue("sku", val)}
                barcode={watch("barcode") || ""} setBarcode={(val) => setValue("barcode", val)}
                isTrackInventory={watch("isTrackInventory")} setIsTrackInventory={(val) => setValue("isTrackInventory", val)}
                isVariable={watch("isVariable")}
                allowBackorders={watch("allowBackorders")} setAllowBackorders={(val) => setValue("allowBackorders", val)}
                isTaxable={watch("isTaxable")} setIsTaxable={(val) => setValue("isTaxable", val)}
              />
              {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}

              {/* 3.5. Size Stock (Simple Product) */}
              <ProductSizeStock
                sizeType={watch("sizeType")} setSizeType={(val) => setValue("sizeType", val)}
                mainStock={watch("simpleStock") || {}} setMainStock={(val) => setValue("simpleStock", val)}
                isVariable={watch("isVariable")}
                mainColorName={watch("mainColorName")} setMainColorName={(val) => setValue("mainColorName", val)}
                mainColorHex={watch("mainColorHex")} setMainColorHex={(val) => setValue("mainColorHex", val)}
                isTrackInventory={watch("isTrackInventory")}
              />

              {/* 4. Variants */}
              <ProductVariants
                isVariable={watch("isVariable")} setIsVariable={(val) => setValue("isVariable", val)}
                sizeType={watch("sizeType")} setSizeType={(val) => setValue("sizeType", val)}
                availableSizes={SIZE_OPTIONS[watch("sizeType")]}
                colors={(watch("variants") || []).map(v => ({
                  id: Math.random().toString(36).substring(7),
                  name: v.colorName,
                  hexCode: v.hexCode,
                  images: v.images,
                  sizes: v.stock ? Object.keys(v.stock) : [],
                  stock: v.stock,
                  isOpen: v.isOpen ?? false,
                  price: v.price?.toString(),
                  originalPrice: v.originalPrice?.toString(),
                  useMainPrice: v.useMainPrice ?? true
                })) as any}
                setColors={(newColors) => {
                  const variants = newColors.map((c: any) => ({
                    colorName: c.name,
                    hexCode: c.hexCode,
                    images: c.images || [],
                    stock: c.stock || c.sizeStocks || {},
                    isOpen: c.isOpen,
                    price: c.price ? Number(c.price) : undefined,
                    originalPrice: c.originalPrice ? Number(c.originalPrice) : undefined,
                    useMainPrice: c.useMainPrice
                  }));
                  setValue("variants", variants);
                }}
                onColorImageUpload={handleColorImageUpload}
                mainPrice={String(watch("price"))}
                mainOriginalPrice={String(watch("originalPrice") || "")}
              />
              {errors.variants && <p className="text-red-500 text-sm">{errors.variants.message}</p>}

            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-8">
              <div className="sticky top-24 space-y-8">
                <ProductSidebar
                  status={watch("status") as any} setStatus={(val) => setValue("status", val)}
                  categoryId={watch("categoryId")} setCategoryId={(val) => setValue("categoryId", val)}
                  categories={categories}
                  brand={watch("brand") || ""} setBrand={(val) => setValue("brand", val)}
                  tags={watch("tags")}
                  addTag={(t) => {
                    const current = watch("tags");
                    if (!current.includes(t)) setValue("tags", [...current, t]);
                  }}
                  removeTag={(t) => {
                    const current = watch("tags");
                    setValue("tags", current.filter(x => x !== t));
                  }}
                  slug={watch("slug") || ""} setSlug={(val) => {
                    setValue("slug", val);
                    setIsSlugManuallyEdited(true);
                  }}
                  seoTitle={watch("seoTitle") || ""} setSeoTitle={(val) => setValue("seoTitle", val)}
                  seoDescription={watch("seoDescription") || ""} setSeoDescription={(val) => setValue("seoDescription", val)}
                />
                {errors.categoryId && <p className="text-red-500 text-sm block mt-2">{errors.categoryId.message}</p>}
              </div>
            </div>

          </div>
        </main>
      </FormProvider>
    </div>
  );

}



