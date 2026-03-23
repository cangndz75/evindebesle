import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductDetailPage from "../../_components/ProductDetailPage";
import ProductSchema from "@/components/seo/ProductSchema";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import FAQPageSchema from "@/components/seo/FAQPageSchema";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

// ISR: Her 1 saatte bir yeniden oluştur
export const revalidate = 3600;
export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Ürünü DB'den çek
async function getProduct(idOrSlug: string) {
  // Önce slug ile dene, sonra id ile
  let product = await prisma.product.findUnique({
    where: { slug: idOrSlug },
    include: {
      category: true,
      colors: {
        include: {
          productImages: {
            orderBy: { order: "asc" },
          },
        },
      },
      sizes: true,
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      variants: {
        include: {
          color: true,
          size: true,
        },
      },
      productImages: {
        orderBy: { order: "asc" },
      },
      washingInstruction: true,
      deliveryInfo: true,
      sizeNote: true,
      sizeGuide: true,
      modelInfo: true,
    },
  });

  // Slug ile bulamazsa id ile dene
  if (!product) {
    product = await prisma.product.findUnique({
      where: { id: idOrSlug },
      include: {
        category: true,
        colors: {
          include: {
            productImages: {
              orderBy: { order: "asc" },
            },
          },
        },
        sizes: true,
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
        productImages: {
          orderBy: { order: "asc" },
        },
        washingInstruction: true,
        deliveryInfo: true,
        sizeNote: true,
        sizeGuide: true,
        modelInfo: true,
      },
    });
  }

  return product;
}

// Dynamic SEO Metadata
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Ürün Bulunamadı | Evinde Besle",
      description: "Aradığınız ürün bulunamadı.",
    };
  }

  const categoryName = product.category?.name || "Ürünler";

  const description = product.description
    ? product.description.slice(0, 160)
    : `${product.name} - ${categoryName} kategorisinde. Evinde Besle'de uygun fiyatlarla.`;

  const images = product.primaryImage
    ? [product.primaryImage]
    : product.productImages?.[0]?.url
      ? [product.productImages[0].url]
      : [];

  return {
    title: `${product.name} | Evinde Besle`,
    description,
    keywords: [
      product.name,
      categoryName,
      product.brand || "",
      product.fabricType || "",
      "evcil hayvan",
      "online alışveriş",
    ].filter(Boolean),
    openGraph: {
      title: product.name,
      description,
      url: `${BASE_URL}/product/${product.slug || product.id}`,
      siteName: "Evinde Besle",
      images: images.map((url: string) => ({
        url,
        width: 800,
        height: 800,
        alt: product.name,
      })),
      type: "website",
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images,
    },
    alternates: {
      canonical: `${BASE_URL}/product/${product.slug || product.id}`,
    },
    robots: {
      index: product.isActive,
      follow: product.isActive,
    },
  };
}

// Ürün detay sayfası
export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || !product.isActive) {
    notFound();
  }

  // Ortalama rating hesapla
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / product.reviews.length
      : 0;

  // Stok durumu hesapla
  const totalStock = product.variants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
  const inStock = totalStock > 0;

  // Görselleri hazırla
  const images = [
    ...(product.primaryImage ? [{ url: product.primaryImage, badge: undefined }] : []),
    ...(product.secondaryImage ? [{ url: product.secondaryImage, badge: undefined }] : []),
    ...product.productImages.map((img: { url: string }) => ({ url: img.url, badge: undefined })),
  ];

  // Renkleri hazırla
  const colors = product.colors.map((c: { name: string; hexCode: string | null; description?: string; productImages: { url: string }[] }) => ({
    name: c.name,
    value: c.hexCode || "#000000",
    description: c.description || "",
    images: c.productImages.map((img: { url: string }) => img.url),
  }));

  // Bedenleri hazırla
  const sizes = product.sizes.map((s: { name: string }) => s.name);

  // Kategori breadcrumb
  const categoryName = product.category?.name || "Ürünler";
  const categorySlug = product.category?.slug || "";

  // ProductDetailPage formatına dönüştür
  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice || undefined,
    description: product.description || "",
    images: images.length > 0 ? images : [{
      url: "https://via.placeholder.com/600x600?text=No+Image",
      badge: undefined
    }],
    colors,
    sizes,
    details: product.detailText ? [product.detailText] : [],
    fabric: product.fabricType || "",
    care: "",
    washing: "",
    delivery: "2-3 iş günü içinde kargo",
    sizeNotes: "",
    rating: avgRating,
    reviewCount: product.reviews.length,
    inStock,
    stockCount: totalStock,
    brand: product.brand || "",
    category: categoryName,
    categorySlug,
    gender: product.gender,
    washingInstruction: product.washingInstruction,
    deliveryInfo: product.deliveryInfo,
    sizeNote: product.sizeNote,
    sizeGuide: product.sizeGuide,
    modelInfo: product.modelInfo,
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Ana Sayfa", url: `${BASE_URL}/home` },
    ...(categorySlug
      ? [{ name: categoryName, url: `${BASE_URL}/category/${categorySlug}` }]
      : []),
    { name: product.name, url: `${BASE_URL}/product/${product.slug || product.id}` },
  ];

  // Fetch company settings for FAQ
  const settings = await prisma.companySettings.findFirst();
  const threshold = settings?.freeShippingThreshold || 99;
  const shippingPrice = settings?.shippingPrice || 49.90;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <ProductSchema
        product={{
          name: product.name,
          description: product.description || "",
          image: images.map((i: any) => i.url),
          sku: product.stockCode || product.id,
          brand: product.brand || "Dark Velvet",
          price: product.price,
          originalPrice: product.originalPrice || undefined,
          currency: "TRY",
          inStock,
          url: `${BASE_URL}/product/${product.slug || product.id}`,
          rating: avgRating,
          reviewCount: product.reviews.length,
          color: product.colors?.[0]?.name,
          size: product.sizes?.[0]?.name,
          material: product.fabricType || undefined,
          gender: product.gender || undefined,
          category: product.category?.name || undefined,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <FAQPageSchema
        faqs={[
          {
            question: "Ürün ne zaman kargoya verilir?",
            answer: "Siparişiniz onaylandıktan sonra 1-2 iş günü içinde kargoya verilir. Kargo süresi 2-3 iş günüdür."
          },
          {
            question: "Ürün değişimi yapılabilir mi?",
            answer: "Evet, ürün teslim tarihinden itibaren 14 gün içinde ücretsiz değişim ve iade hakkınız bulunmaktadır."
          },
          {
            question: "Ürün bakımı nasıl yapılmalı?",
            answer: product.washingInstruction?.content || "Ürün etiketindeki yıkama talimatlarına uyunuz. Genellikle 30 derecede makinede yıkanabilir."
          },
          {
            question: "Kargo ücreti ne kadar?",
            answer: `${threshold} TL üzeri alışverişlerde kargo ücretsizdir. Altındaki siparişlerde kargo bedeli ${shippingPrice.toFixed(2)} TL'dir.`
          }
        ]}
      />

      {/* Ürün Detay Sayfası */}
      <ProductDetailPage product={productData} />
    </>
  );
}
