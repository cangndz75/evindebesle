import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductDetailPage from "../../_components/ProductDetailPage";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true, slug: { not: null } },
    select: { slug: true },
  });

  return products
    .filter((p: any) => p.slug)
    .map((product: any) => ({
      slug: product.slug!,
    }));
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

  const product = await prisma.product.findFirst({
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
            },
          },
        },
      },
    },
  });

  if (!product) {
    notFound();
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
      // Renk images'ı parse et (eğer string ise)
      let colorImages: string[] = [];
      if (selectedColor?.images) {
        if (typeof selectedColor.images === 'string') {
          try {
            colorImages = JSON.parse(selectedColor.images);
          } catch {
            colorImages = [selectedColor.images];
          }
        } else if (Array.isArray(selectedColor.images)) {
          colorImages = selectedColor.images;
        }
      }

      // Debug: Server-side console'da görünecek
      console.log('[ProductSlugPage] Selected color:', selectedColor?.name);
      console.log('[ProductSlugPage] Color images (raw):', selectedColor?.images);
      console.log('[ProductSlugPage] Color images (parsed):', colorImages);
      console.log('[ProductSlugPage] Product primaryImage:', product.primaryImage);
      console.log('[ProductSlugPage] Product image:', product.image);

      if (colorImages.length > 0) {
        console.log('[ProductSlugPage] Using color images');
        return colorImages.map((img: string) => ({ url: img, badge: undefined }));
      }
      if (product.primaryImage) {
        console.log('[ProductSlugPage] Using primaryImage');
        return [{ url: product.primaryImage, badge: undefined }];
      }
      if (product.image) {
        console.log('[ProductSlugPage] Using image');
        return [{ url: product.image, badge: undefined }];
      }
      console.log('[ProductSlugPage] No images found');
      return [];
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
      createdAt: r.createdAt,
      colorId: r.colorId || undefined,
      colorName: r.color?.name,
    })),
    details: product.detailText ? [product.detailText] : [],
    fabric: product.fabricType || "",
    care: "",
    washing: "",
    delivery: "2-3 iş günü içinde teslimat",
    sizeNotes: "",
  };

  return <ProductDetailPage product={formattedProduct} />;
}
