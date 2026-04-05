import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { cache } from "react";
import ProductDetailPage from "../../_components/ProductDetailPage";
import ProductSchema from "@/components/seo/ProductSchema";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import FAQPageSchema from "@/components/seo/FAQPageSchema";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

const getProduct = cache(async (idOrSlug: string) => {
  const include = {
    category: true,
    colors: {
      include: {
        productImages: {
          orderBy: { order: "asc" as const },
        },
      },
    },
    sizes: true,
    reviews: {
      where: { isApproved: true },
      orderBy: { createdAt: "desc" as const },
      take: 20,
    },
    variants: {
      include: {
        color: true,
        size: true,
      },
    },
    productImages: {
      orderBy: { order: "asc" as const },
    },
    washingInstruction: true,
    deliveryInfo: true,
    sizeNote: true,
    sizeGuide: true,
    modelInfo: true,
  };

  const productBySlug = await prisma.product.findUnique({
    where: { slug: idOrSlug },
    include,
  });

  if (productBySlug) return productBySlug;

  return prisma.product.findUnique({
    where: { id: idOrSlug },
    include,
  });
});

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "ÃœrÃ¼n BulunamadÄ± | Evinde Besle",
      description: "AradÄ±ÄŸÄ±nÄ±z Ã¼rÃ¼n bulunamadÄ±.",
    };
  }

  const categoryName = product.category?.name || "ÃœrÃ¼nler";

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
      "online alÄ±ÅŸveriÅŸ",
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || !product.isActive) {
    notFound();
  }

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const totalStock = product.variants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
  const inStock = totalStock > 0;

  const images = [
    ...(product.primaryImage ? [{ url: product.primaryImage, badge: undefined }] : []),
    ...(product.secondaryImage ? [{ url: product.secondaryImage, badge: undefined }] : []),
    ...product.productImages.map((img: { url: string }) => ({ url: img.url, badge: undefined })),
  ];

  const colors = product.colors.map((c: { name: string; hexCode: string | null; description?: string; productImages: { url: string }[] }) => ({
    name: c.name,
    value: c.hexCode || "#000000",
    description: c.description || "",
    images: c.productImages.map((img: { url: string }) => img.url),
  }));

  const sizes = product.sizes.map((s: { name: string }) => s.name);

  const categoryName = product.category?.name || "ÃœrÃ¼nler";
  const categorySlug = product.category?.slug || "";

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
    delivery: "2-3 iÅŸ gÃ¼nÃ¼ iÃ§inde kargo",
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

  const breadcrumbItems = [
    { name: "Ana Sayfa", url: `${BASE_URL}/home` },
    ...(categorySlug
      ? [{ name: categoryName, url: `${BASE_URL}/category/${categorySlug}` }]
      : []),
    { name: product.name, url: `${BASE_URL}/product/${product.slug || product.id}` },
  ];

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
            question: "ÃœrÃ¼n ne zaman kargoya verilir?",
            answer: "SipariÅŸiniz onaylandÄ±ktan sonra 1-2 iÅŸ gÃ¼nÃ¼ iÃ§inde kargoya verilir. Kargo sÃ¼resi 2-3 iÅŸ gÃ¼nÃ¼dÃ¼r."
          },
          {
            question: "ÃœrÃ¼n deÄŸiÅŸimi yapÄ±labilir mi?",
            answer: "Evet, Ã¼rÃ¼n teslim tarihinden itibaren 14 gÃ¼n iÃ§inde Ã¼cretsiz deÄŸiÅŸim ve iade hakkÄ±nÄ±z bulunmaktadÄ±r."
          },
          {
            question: "ÃœrÃ¼n bakÄ±mÄ± nasÄ±l yapÄ±lmalÄ±?",
            answer: product.washingInstruction?.content || "ÃœrÃ¼n etiketindeki yÄ±kama talimatlarÄ±na uyunuz. Genellikle 30 derecede makinede yÄ±kanabilir."
          },
          {
            question: "Kargo Ã¼creti ne kadar?",
            answer: `${threshold} TL Ã¼zeri alÄ±ÅŸveriÅŸlerde kargo Ã¼cretsizdir. AltÄ±ndaki sipariÅŸlerde kargo bedeli ${shippingPrice.toFixed(2)} TL'dir.`
          }
        ]}
      />

      {/* ÃœrÃ¼n Detay SayfasÄ± */}
      <ProductDetailPage product={productData} />
    </>
  );
}
