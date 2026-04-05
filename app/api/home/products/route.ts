export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { Product } from "@/lib/homeData";
import { resolveSwatchHex } from "@/lib/color-swatch";

export const revalidate = 300;

function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // "new-arrivals" | "best-sellers" | "featured"
    const gender = searchParams.get("gender"); // "MALE" | "FEMALE" | null
    const limit = parseInt(searchParams.get("limit") || "8");

    let products;

    if (type === "new-arrivals") {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(gender && { gender: gender as "MALE" | "FEMALE" }),
          tags: {
            some: {
              name: {
                in: ["yeni ürün", "yeni", "yeni gelenler", "new", "new arrival"],
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          image: true,
          primaryImage: true,
          secondaryImage: true,
          colors: {
            take: 5,
            select: {
              id: true,
              name: true,
              hexCode: true,
              images: true,
              variants: {
                select: {
                  id: true,
                  variantCode: true,
                  colorId: true,
                  sizeId: true,
                  stock: true,
                  price: true,
                },
              },
            },
          },
          sizes: {
            select: {
              id: true,
              name: true,
              stock: true,
            },
          },
          sizeOptions: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });
    } else if (type === "best-sellers") {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(gender && { gender: gender as "MALE" | "FEMALE" }),
          OR: [
            {
              tags: {
                some: {
                  name: {
                    in: ["çok satan", "best seller", "bestseller", "en çok satan"],
                  },
                },
              },
            },
            {
              orderItems: {
                some: {},
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          image: true,
          primaryImage: true,
          secondaryImage: true,
          createdAt: true,
          colors: {
            take: 5,
            select: {
              id: true,
              name: true,
              hexCode: true,
              images: true,
              variants: {
                select: {
                  id: true,
                  variantCode: true,
                  colorId: true,
                  sizeId: true,
                  stock: true,
                  price: true,
                },
              },
            },
          },
          sizes: {
            select: {
              id: true,
              name: true,
              stock: true,
            },
          },
          sizeOptions: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      products.sort((a: any, b: any) => {
        const aCount = a._count.orderItems;
        const bCount = b._count.orderItems;
        if (bCount !== aCount) {
          return bCount - aCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (type === "featured") {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            {
              tags: {
                some: {
                  name: {
                    in: ["öne çıkan", "featured", "trend", "popüler"],
                  },
                },
              },
            },
            {
              orderItems: {
                some: {},
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          image: true,
          primaryImage: true,
          secondaryImage: true,
          createdAt: true,
          colors: {
            select: {
              id: true,
              name: true,
              hexCode: true,
              images: true,
              variants: {
                select: {
                  id: true,
                  variantCode: true,
                  colorId: true,
                  sizeId: true,
                  stock: true,
                  price: true,
                },
              },
            },
          },
          sizes: {
            select: {
              id: true,
              name: true,
              stock: true,
            },
          },
          sizeOptions: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      products.sort((a: any, b: any) => {
        const aCount = a._count.orderItems;
        const bCount = b._count.orderItems;
        if (bCount !== aCount) {
          return bCount - aCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      return NextResponse.json(
        { error: "Geçersiz type parametresi" },
        { status: 400 }
      );
    }

    const formattedProducts = products.map((product: any) => {
      const firstColor = product.colors[0];
      const colorImages = firstColor?.images || [];
      const mainImage = product.primaryImage || product.image || colorImages[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
      const hoverImage = product.secondaryImage || colorImages[1] || mainImage;

      if (type === "featured") {
        return {
          id: product.id,
          title: product.name,
          price: product.price,
          image: mainImage,
          hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
          colors: product.colors.map((c: any) => {
            const images = parseImages(c.images);
            return {
              name: (c as any).name || "",
              value: resolveSwatchHex({ name: (c as any).name, hexCode: (c as any).hexCode }),
              image: images[0] || mainImage,
            };
          }),
          sizes: product.sizes?.map((s: { name: string; stock: number; id: string }) => ({ name: s.name, stock: s.stock, id: s.id })) || [],
          sizeOptions: product.sizeOptions?.map((so: { name: string; id: string }) => ({ name: so.name, id: so.id })) || [],
          colorId: product.colors[0]?.id,
          variants: product.colors[0]?.variants?.map((v: { colorId: string | null; sizeId: string | null; stock: number }) => ({
            colorId: v.colorId,
            sizeId: v.sizeId,
            stock: v.stock,
          })) || [],
        };
      }

      return {
        id: product.id,
        title: product.name,
        price: product.price,
        originalPrice: product.originalPrice || undefined,
        image: mainImage,
        hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
        badge: product.originalPrice ? "İndirim" : "Yeni",
        colors: product.colors.map((c: any) => {
          const images = parseImages(c.images);
          return images[0] || "";
        }).filter(Boolean),
        sizes: product.sizes?.map((s: any) => ({ name: s.name, stock: s.stock, id: s.id })) || [],
        sizeOptions: product.sizeOptions?.map((so: any) => ({ name: so.name, id: so.id })) || [],
        colorId: product.colors[0]?.id,
        variants: product.colors[0]?.variants?.map((v: { colorId: string | null; sizeId: string | null; stock: number }) => ({
          colorId: v.colorId,
          sizeId: v.sizeId,
          stock: v.stock,
        })) || [],
      };
    });

    const response = NextResponse.json(formattedProducts);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error("Error fetching home products:", error);
    return NextResponse.json(
      { error: "Ürünler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
