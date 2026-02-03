"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

// Components
import { ProductInfo } from "./components/ProductInfo";
import { ProductPricingInventory } from "./components/ProductPricingInventory";
import { ProductMedia } from "./components/ProductMedia";
import { ProductVariants, Color, SizeType } from "./components/ProductVariants";
import { ProductSidebar } from "./components/ProductSidebar";

// Utils
import { generateProductSlug } from "@/lib/slug";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- TOP LEVEL STATE ---

  // 1. Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // 2. Pricing & Inventory
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isTrackInventory, setIsTrackInventory] = useState(true);
  const [stock, setStock] = useState(0); // For simple product
  const [allowBackorders, setAllowBackorders] = useState(false);
  const [isTaxable, setIsTaxable] = useState(true);

  // 3. Media
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState("");
  const [secondaryImage, setSecondaryImage] = useState("");

  // 4. Variants
  const [isVariable, setIsVariable] = useState(false);
  const [sizeType, setSizeType] = useState<SizeType>("letter");
  const [colors, setColors] = useState<Color[]>([]);

  // 5. Sidebar (Status, Org, SEO)
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Mock Categories (In real app, fetch these)
  const [categories, setCategories] = useState([
    { id: "clothing", name: "Giyim" },
    { id: "accessories", name: "Aksesuar" },
    { id: "new-arrivals", name: "Yeni Gelenler" },
  ]);

  // --- EFFECT: Auto-Slug ---
  useEffect(() => {
    // Only auto-update if user hasn't manually edited it significantly (simple check: if it matches old name slug)
    // Or just auto-update until save.
    if (!name) return;
    const generated = generateProductSlug(name);
    if (!slug || slug.startsWith(generated.slice(0, 5))) { // approximate check
      setSlug(generated);
      setSeoTitle(`${name} - ${brand || "Mağaza"}`);
    }
  }, [name, brand]);


  // --- HANDLERS ---

  const handleMediaUpload = async (files: FileList) => {
    const newImages: string[] = [];

    // For this refactor, we'll simulate succesful upload by creating local object URLs
    // In production, you MUST replace this with actual backend upload
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      newImages.push(url);
    });

    setUploadedImages(prev => [...prev, ...newImages]);

    // Auto-set primary/secondary if first upload
    if (uploadedImages.length === 0 && newImages.length > 0) {
      setPrimaryImage(newImages[0]);
      if (newImages.length > 1) setSecondaryImage(newImages[1]);
    }

    toast.success(`${newImages.length} görsel yüklendi`);

    // TODO: Implement actual API upload call here:
    // const res = await fetch('/api/upload', { method: 'POST', body: formData }); ...
  };

  const handleColorImageUpload = (files: FileList, colorIndex: number) => {
    // Simulating upload
    const newImages: string[] = [];
    Array.from(files).forEach(file => {
      newImages.push(URL.createObjectURL(file));
    });

    const newColors = [...colors];
    newColors[colorIndex].images = [...(newColors[colorIndex].images || []), ...newImages];
    setColors(newColors);

    toast.success("Varyant görselleri güncellendi");
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) setTags([...tags, tag]);
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (!name || !price) {
        toast.error("Lütfen zorunlu alanları doldurun (İsim, Fiyat)");
        setLoading(false);
        return;
      }

      // Construct Payload
      const payload = {
        name,
        description,
        slug,
        stockCode: sku, // Mapping UI 'sku' to DB 'stockCode'
        price,
        originalPrice,

        // Media
        image: primaryImage, // Legacy field
        primaryImage,
        secondaryImage,

        // Organization
        categoryId,
        brand,
        tags: tags.map(t => ({ name: t })), // Creating tag objects

        // Attributes
        isActive: status === 'published',

        // Variants Logic
        colors: isVariable ? colors.map(c => ({
          name: c.name,
          hexCode: c.hexCode,
          images: c.images, // Array of URLs
          sizes: c.sizes,   // Array of size strings
          stock: c.stock,   // Stock object { "S": 10 }
          sizeStocks: c.stock // Backend might expect this naming or we adapt
        })) : [],

        // Simple Product Logic
        sizes: !isVariable && stock > 0 ? [{ name: "Standart", stock: stock }] : [], // Simplification for non-variant

        // Additional
        gender: "Unisex", // Default or add to UI
        sizeType: isVariable ? sizeType : null,
        fabricType: "Cotton", // Default or add to UI
        weight: null
      };

      const res = await fetch("/api/admin-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ürün oluşturulamadı");
      }

      const createdProduct = await res.json();
      toast.success("Ürün başarıyla oluşturuldu!");
      router.push("/admin-products"); // Redirect to list

    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Yeni Ürün Ekle</h1>
            <p className="text-xs text-gray-500 mt-1">{isVariable ? "Varyantlı Ürün" : "Tekil Ürün"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-gray-600 border-gray-300" onClick={() => toast.info("Taslak yerel olarak kaydedildi")}>
            Taslağı Kaydet
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gray-900 text-white hover:bg-black shadow-md transition-all active:scale-95"
          >
            {loading ? "Yayınlanıyor..." : "Ürünü Yayınla"}
          </Button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-[1600px] mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column (Main Form) */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. Product Info */}
            <section id="basics">
              <ProductInfo
                name={name} setName={setName}
                description={description} setDescription={setDescription}
              />
            </section>

            {/* 2. Media */}
            <section id="media">
              <ProductMedia
                uploadedImages={uploadedImages}
                primaryImage={primaryImage} setPrimaryImage={setPrimaryImage}
                secondaryImage={secondaryImage} setSecondaryImage={setSecondaryImage}
                onFilesSelected={handleMediaUpload}
                onRemoveImage={(idx) => {
                  const newImgs = [...uploadedImages];
                  newImgs.splice(idx, 1);
                  setUploadedImages(newImgs);
                }}
              />
            </section>

            {/* 3. Pricing & Inventory */}
            <section id="pricing">
              <ProductPricingInventory
                price={price} setPrice={setPrice}
                originalPrice={originalPrice} setOriginalPrice={setOriginalPrice}
                sku={sku} setSku={setSku}
                barcode={barcode} setBarcode={setBarcode}
                isTrackInventory={isTrackInventory} setIsTrackInventory={setIsTrackInventory}
                stock={stock} setStock={setStock}
                isVariable={isVariable}
                allowBackorders={allowBackorders} setAllowBackorders={setAllowBackorders}
                isTaxable={isTaxable} setIsTaxable={setIsTaxable}
              />
            </section>

            {/* 4. Variants */}
            <section id="variants">
              <ProductVariants
                isVariable={isVariable} setIsVariable={setIsVariable}
                sizeType={sizeType} setSizeType={setSizeType}
                availableSizes={[]} // handled internally
                colors={colors} setColors={setColors}
                onColorImageUpload={handleColorImageUpload}
              />
            </section>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24 space-y-8">
              <ProductSidebar
                status={status} setStatus={setStatus}
                categoryId={categoryId} setCategoryId={setCategoryId}
                categories={categories}
                brand={brand} setBrand={setBrand}
                tags={tags} addTag={addTag} removeTag={removeTag}
                slug={slug} setSlug={setSlug}
                seoTitle={seoTitle} setSeoTitle={setSeoTitle}
                seoDescription={seoDescription} setSeoDescription={setSeoDescription}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
