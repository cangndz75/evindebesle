import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { cache } from "react";
import Link from "next/link";
import ProductDetailPage from "../../_components/ProductDetailPage";
import ProductSchema from "@/components/seo/ProductSchema";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import FAQPageSchema from "@/components/seo/FAQPageSchema";
import { buildProductAbsoluteUrl, buildProductPath } from "@/lib/seo/productPath";
import { resolveSwatchHex } from "@/lib/color-swatch";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dark-velvet.com";

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ id: string }>;
  skipRedirect?: boolean;
}

const getCanonicalProduct = cache(async (idOrSlug: string) => {
  const productBySlug = await prisma.product.findUnique({
    where: { slug: idOrSlug },
    select: {
      id: true,
      slug: true,
      gender: true,
      category: {
        select: { slug: true },
      },
      isActive: true,
    },
  });

  if (productBySlug) return productBySlug;

  return prisma.product.findUnique({
    where: { id: idOrSlug },
    select: {
      id: true,
      slug: true,
      gender: true,
      category: {
        select: { slug: true },
      },
      isActive: true,
    },
  });
});

const getProduct = cache(async (idOrSlug: string) => {
  const include = {
    category: {
      include: {
        defaultSizeGuide: true,
      },
    },
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
      title: "Ürün Bulunamadı | Dark Velvet",
      description: "Aradığınız ürün bulunamadı.",
    };
  }

  const categoryName = product.category?.name || "Ürünler";

  const description = product.description
    ? product.description.slice(0, 160)
    : `${product.name} - ${categoryName} kategorisinde. Dark Velvet'de uygun fiyatlarla.`;

  const images = product.primaryImage
    ? [product.primaryImage]
    : product.productImages?.[0]?.url
      ? [product.productImages[0].url]
      : [];

  const canonicalUrl = buildProductAbsoluteUrl(BASE_URL, {
    id: product.id,
    slug: product.slug,
    gender: product.gender,
    categorySlug: product.category?.slug,
  });

  const dynamicOgImage = `${BASE_URL}/product/${product.slug || product.id}/opengraph-image`;

  return {
    title: `${product.name} - Dark Velvet | Ozel Tasarim ${categoryName}`,
    description,
    keywords: [
      product.name,
      categoryName,
      product.brand || "",
      product.fabricType || "",
      "moda",
      "online alışveriş",
    ].filter(Boolean),
    openGraph: {
      title: product.name,
      description,
      url: canonicalUrl,
      siteName: "Dark Velvet",
      images: [
        {
          url: dynamicOgImage,
          width: 1200,
          height: 630,
          alt: `${product.name} - Dark Velvet`,
        },
        ...images.map((url: string) => ({
          url,
          width: 800,
          height: 800,
          alt: product.name,
        })),
      ],
      type: "website",
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [dynamicOgImage, ...images],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: product.isActive,
      follow: product.isActive,
    },
  };
}

export default async function ProductPage({ params, skipRedirect }: ProductPageProps) {
  const { id } = await params;

  if (!skipRedirect) {
    const canonicalProduct = await getCanonicalProduct(id);

    if (!canonicalProduct || !canonicalProduct.isActive) {
      notFound();
    }

    const canonicalPath = buildProductPath({
      id: canonicalProduct.id,
      slug: canonicalProduct.slug,
      gender: canonicalProduct.gender,
      categorySlug: canonicalProduct.category?.slug,
    });

    permanentRedirect(canonicalPath);
  }

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

  const colors = product.colors.map((c: { id: string; name: string; hexCode: string | null; description?: string; productImages: { url: string }[] }) => ({
    id: c.id,
    name: c.name,
    value: resolveSwatchHex({ name: c.name, hexCode: c.hexCode }),
    description: c.description || "",
    images: c.productImages.map((img: { url: string }) => img.url),
  }));

  const sizes = product.sizes.map((s: { id: string; name: string; stock: number }) => ({
    id: s.id,
    name: s.name,
    stock: s.stock,
  }));

  const sizeOptions = product.sizeOptions.map((so: { id: string; name: string }) => ({
    id: so.id,
    name: so.name,
  }));

  const variants = product.variants
    .filter((v: { colorId: string | null }) => v.colorId !== null)
    .map((v: { colorId: string | null; sizeId: string | null; stock: number; variantCode: string }) => ({
      colorId: v.colorId!,
      sizeId: v.sizeId,
      stock: v.stock,
      variantCode: v.variantCode,
    }));

  const categoryName = product.category?.name || "Ürünler";
  const categorySlug = product.category?.slug || "";

  const canonicalUrl = buildProductAbsoluteUrl(BASE_URL, {
    id: product.id,
    slug: product.slug,
    gender: product.gender,
    categorySlug,
  });

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
    sizeOptions,
    variants,
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
    sizeGuide: product.sizeGuide || product.category?.defaultSizeGuide || null,
    modelInfo: product.modelInfo,
  };

  const breadcrumbItems = [
    { name: "Ana Sayfa", url: `${BASE_URL}` },
    ...(categorySlug
      ? [{ name: categoryName, url: `${BASE_URL}/category/${categorySlug}` }]
      : []),
    { name: product.name, url: canonicalUrl },
  ];

  const settings = await prisma.companySettings.findFirst();
  const threshold = settings?.freeShippingThreshold || 99;
  const shippingPrice = settings?.shippingPrice || 49.90;

  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId || undefined,
      id: { not: product.id },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      gender: true,
      category: {
        select: { slug: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return (
    <>
      
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
          url: canonicalUrl,
          rating: avgRating,
          reviewCount: product.reviews.length,
          color: product.colors?.[0]?.name,
          size: product.sizes?.[0]?.name,
          material: product.fabricType || undefined,
          gender: product.gender || undefined,
          category: product.category?.name || undefined,
          shippingPrice,
          freeShippingThreshold: threshold,
          returnWindowDays: 14,
          returnPolicyUrl: `${BASE_URL}/contract`,
          reviews: product.reviews.map((review: { userName: string | null; rating: number; comment: string | null; createdAt: Date }) => ({
            authorName: review.userName || null,
            rating: review.rating,
            comment: review.comment || null,
            createdAt: review.createdAt,
          })),
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

      
      <ProductDetailPage product={productData} />

      {relatedProducts.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">Benzer Urunler</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct: { id: string; slug: string | null; name: string; price: number; gender: string | null; category: { slug: string } | null }) => (
              <li key={relatedProduct.id} className="rounded-lg border bg-white p-4">
                <Link
                  href={buildProductPath({
                    id: relatedProduct.id,
                    slug: relatedProduct.slug,
                    gender: relatedProduct.gender,
                    categorySlug: relatedProduct.category?.slug,
                  })}
                  className="block text-sm font-medium text-neutral-900 hover:underline"
                >
                  {relatedProduct.name}
                </Link>
                <p className="mt-1 text-sm text-neutral-600">{relatedProduct.price.toFixed(2)} TL</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
