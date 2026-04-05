import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductDetailPage from "../../_components/ProductDetailPage";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const dynamic = "force-dynamic";

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
      lookConfiguration: {
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  primaryImage: true,
                  price: true,
                  originalPrice: true,
                  slug: true,
                }
              }
            },
            orderBy: { order: "asc" }
          }
        }
      },
      lookItems: {
        include: {
          lookConfiguration: {
            include: {
              mainProduct: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  primaryImage: true,
                  price: true,
                  originalPrice: true,
                  slug: true,
                }
              }
            }
          }
        }
      }
    },
  });

  if (!product) {
    product = await prisma.product.findUnique({
      where: { id: slug }, // slug parametresi aslÄ±nda id olabilir
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
        lookConfiguration: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    primaryImage: true,
                    price: true,
                    originalPrice: true,
                    slug: true,
                  }
                }
              },
              orderBy: { order: "asc" }
            }
          }
        },
        lookItems: {
          include: {
            lookConfiguration: {
              include: {
                mainProduct: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    primaryImage: true,
                    price: true,
                    originalPrice: true,
                    slug: true,
                  }
                }
              }
            }
          }
        }
      },
    });
  }

  if (!product) {
    notFound();
  }

  const user = await getCurrentUser();
  let hasOrdered = false;

  if (user) {
    const orderCount = await prisma.order.count({
      where: {
        userId: user.id,
        status: "DELIVERED", // Sadece teslim edilmiÅŸ sipariÅŸler
        items: {
          some: {
            productId: product.id,
          },
        },
      },
    });
    hasOrdered = orderCount > 0;
  }

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

  const formattedProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice || undefined,
    description: product.description || "",
    images: (() => {
      const allImageUrls = new Set<string>();

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

      if (product.productImages) {
        product.productImages.forEach((img: any) => {
          if (!img.colorId || img.colorId === selectedColor?.id) {
            if (img.url) allImageUrls.add(img.url);
          }
        });
      }

      if (product.primaryImage) allImageUrls.add(product.primaryImage);
      if (product.image) allImageUrls.add(product.image);

      const finalImages = Array.from(allImageUrls).map(url => ({
        url,
        badge: undefined
      }));

      console.log('[ProductSlugPage] Final Images Count:', finalImages.length);

      return finalImages;
    })(),
    colors: product.colors.map((c: any) => {
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
        variant: c.variants?.[0]?.variantCode, // Ä°lk variant'Ä±n kodunu al
        images: parsedImages,
        image: parsedImages.length > 0 ? parsedImages[0] : undefined, // Ä°lk resmi image olarak da ekle (TabbedProductCarousel uyumluluÄŸu iÃ§in)
      };
    }),
    sizes: (() => {
      console.log('[ProductSlugPage] Product sizes:', product.sizes);
      console.log('[ProductSlugPage] Product sizeOptions:', product.sizeOptions);
      console.log('[ProductSlugPage] Sizes length:', product.sizes?.length || 0);
      console.log('[ProductSlugPage] SizeOptions length:', product.sizeOptions?.length || 0);

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
          stock: 0, // sizeOptions iÃ§in stok bilgisi yok, varsayÄ±lan 0
        }));
      }
      console.log('[ProductSlugPage] No sizes found');
      return [];
    })(),
    variants: product.variants
      .filter((v: any) => v.colorId !== null) // null colorId'li variant'larÄ± filtrele
      .map((v: any) => ({
        colorId: v.colorId!, // Non-null assertion Ã§Ã¼nkÃ¼ yukarÄ±da filtreledik
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
    delivery: "2-3 iÅŸ gÃ¼nÃ¼ iÃ§inde teslimat",
    sizeNotes: "",
    combinations: product.combinations.map((c: any) => ({
      id: c.relatedProduct.id,
      name: c.relatedProduct.name,
      price: c.relatedProduct.price,
      originalPrice: c.relatedProduct.originalPrice || undefined,
      image: c.relatedProduct.image || undefined,
      slug: c.relatedProduct.slug || c.relatedProduct.id,
    })),
    lookConfiguration: product.lookConfiguration || undefined,
    parentLookConfigs: (product as any).lookItems?.map((li: any) => ({
      ...li.lookConfiguration,
      mainProduct: li.lookConfiguration?.mainProduct
    })) || []
  };

  return <ProductDetailPage product={formattedProduct} hasOrdered={hasOrdered} />;
}
