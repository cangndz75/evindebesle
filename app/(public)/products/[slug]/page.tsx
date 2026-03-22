import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductDetailPage from "../../_components/ProductDetailPage";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, slug: { not: null } },
      select: { slug: true },
    });

    return products
      .filter((p: any) => p.slug)
      .map((product: any) => ({
        slug: product.slug!,
      }));
  } catch {
    return [];
  }
}

export default async function ProductSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const { slug } = await params;
  const { variant } = await searchParams;

  if (!slug) {
    notFound();
  }

  let product = await prisma.product.findUnique({
    where: { slug },
    include: {
      colors: {
        include: {
          variants: true,
        },
      },
      sizes: true,
      sizeOptions: true,
      tags: true,
      variants: {
        include: {
          color: true,
          size: true,
        },
      },
      reviews: {
        where: { isApproved: true },
        include: {
          color: {
            select: {
              id: true,
              name: true,
              hexCode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      combinations: {
        include: {
          relatedProduct: {
            select: {
              id: true,
              name: true,
              image: true,
              price: true,
              originalPrice: true,
              slug: true,
            },
          },
        },
      },
      washingInstruction: true,
      deliveryInfo: true,
      sizeNote: true,
      sizeGuide: true,
      modelInfo: true,
      productImages: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  // Slug ile bulamazsa id ile dene (eski ürünler için fallback)
  if (!product) {
    product = await prisma.product.findUnique({
      where: { id: slug }, // slug parametresi aslında id olabilir
      include: {
        colors: {
          include: {
            variants: true,
          },
        },
        sizes: true,
        sizeOptions: true,
        tags: true,
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            color: {
              select: {
                id: true,
                name: true,
                hexCode: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        combinations: {
          include: {
            relatedProduct: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                originalPrice: true,
                slug: true,
              },
            },
          },
        },
        washingInstruction: true,
        deliveryInfo: true,
        sizeNote: true,
        sizeGuide: true,
        modelInfo: true,
        productImages: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  if (!product) {
    notFound();
  }

  // Kullanıcının bu ürünü sipariş verip vermediğini kontrol et
  const user = await getCurrentUser();
  let hasOrdered = false;

  if (user) {
    const orderCount = await prisma.order.count({
      where: {
        userId: user.id,
        status: "DELIVERED", // Sadece teslim edilmiş siparişler
        items: {
          some: {
            productId: product.id,
          },
        },
      },
    });
    hasOrdered = orderCount > 0;
  }

  // Variant'a göre renk seçimi
  let selectedColor = product.colors?.[0];
  if (variant) {
    const variantData = await prisma.productVariant.findUnique({
      where: { variantCode: variant },
      include: {
        color: {
          include: {
            variants: true,
          },
        },
      },
    });
    if (variantData?.color) {
      selectedColor = variantData.color;
    }
  }

  // ProductDetailPage için format
  const formattedProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice || undefined,
    description: product.description || "",
    images: (() => {
      const allImageUrls = new Set<string>();

      // 1. Renk bazlı images'ı ekle (JSON string veya array)
      if (selectedColor?.images) {
        let parsed: string[] = [];
        if (typeof selectedColor.images === 'string') {
          try {
            parsed = JSON.parse(selectedColor.images);
          } catch {
            parsed = [selectedColor.images];
          }
        } else if (Array.isArray(selectedColor.images)) {
          parsed = selectedColor.images;
        }
        parsed.forEach(url => url && allImageUrls.add(url));
      }

      // 2. ProductImage tablosundan bu renge ait olanları veya genel olanları (colorId null) ekle
      if (product.productImages) {
        product.productImages.forEach((img: any) => {
          // Eğer bu renk seçiliyse, o rengin resimlerini VEYA genel resimleri ekle
          if (!img.colorId || img.colorId === selectedColor?.id) {
            if (img.url) allImageUrls.add(img.url);
          }
        });
      }

      // 3. Legacy alanları fallback olarak ekle
      if (product.primaryImage) allImageUrls.add(product.primaryImage);
      if (product.image) allImageUrls.add(product.image);

      const finalImages = Array.from(allImageUrls).map(url => ({
        url,
        badge: undefined
      }));

      // Debug
      console.log('[ProductSlugPage] Final Images Count:', finalImages.length);

      return finalImages;
    })(),
    colors: product.colors.map((c: any) => {
      // images'ı parse et (eğer string ise)
      let parsedImages: string[] = [];
      if (c.images) {
        if (typeof c.images === 'string') {
          try {
            parsedImages = JSON.parse(c.images);
          } catch {
            parsedImages = [c.images];
          }
        } else if (Array.isArray(c.images)) {
          parsedImages = c.images;
        }
      }

      return {
        id: c.id,
        name: c.name,
        value: c.hexCode || "#000000",
        description: c.description || "",
        variant: c.variants?.[0]?.variantCode, // İlk variant'ın kodunu al
        images: parsedImages,
        image: parsedImages.length > 0 ? parsedImages[0] : undefined, // İlk resmi image olarak da ekle (TabbedProductCarousel uyumluluğu için)
      };
    }),
    sizes: (() => {
      // Debug: Server-side console'da görünecek
      console.log('[ProductSlugPage] Product sizes:', product.sizes);
      console.log('[ProductSlugPage] Product sizeOptions:', product.sizeOptions);
      console.log('[ProductSlugPage] Sizes length:', product.sizes?.length || 0);
      console.log('[ProductSlugPage] SizeOptions length:', product.sizeOptions?.length || 0);

      // Eğer sizes doluysa onu kullan, değilse sizeOptions'ı kullan
      if (product.sizes && product.sizes.length > 0) {
        console.log('[ProductSlugPage] Using sizes');
        return product.sizes.map((s: any) => ({
          id: s.id,
          name: s.name,
          stock: s.stock,
        }));
      } else if (product.sizeOptions && product.sizeOptions.length > 0) {
        console.log('[ProductSlugPage] Using sizeOptions');
        return product.sizeOptions.map((so: any) => ({
          id: so.id,
          name: so.name,
          stock: 0, // sizeOptions için stok bilgisi yok, varsayılan 0
        }));
      }
      console.log('[ProductSlugPage] No sizes found');
      return [];
    })(),
    variants: product.variants
      .filter((v: any) => v.colorId !== null) // null colorId'li variant'ları filtrele
      .map((v: any) => ({
        colorId: v.colorId!, // Non-null assertion çünkü yukarıda filtreledik
        sizeId: v.sizeId,
        stock: v.stock,
        variantCode: v.variantCode,
      })),
    reviews: product.reviews.map((r: any) => ({
      id: r.id,
      userName: r.userName || "Misafir",
      rating: r.rating,
      comment: r.comment || "",
      createdAt: r.createdAt.toISOString(),
      colorId: r.colorId || undefined,
      colorName: r.color?.name,
    })),
    details: product.detailText ? [product.detailText] : [],
    fabric: product.fabricType || "",
    care: "",
    washing: "",
    delivery: "2-3 iş günü içinde teslimat",
    sizeNotes: "",
    combinations: product.combinations.map((c: any) => ({
      id: c.relatedProduct.id,
      name: c.relatedProduct.name,
      price: c.relatedProduct.price,
      originalPrice: c.relatedProduct.originalPrice || undefined,
      image: c.relatedProduct.image || undefined,
      slug: c.relatedProduct.slug || c.relatedProduct.id,
    })),
  };

  return <ProductDetailPage product={formattedProduct} hasOrdered={hasOrdered} />;
}
