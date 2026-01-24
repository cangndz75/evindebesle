import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Kombin ürünlerini getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIds = searchParams.get("productIds");

    if (!productIds) {
      return NextResponse.json([]);
    }

    const ids = productIds.split(",").filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    // Kombin ürünlerini bul
    const combinations = await prisma.productCombination.findMany({
      where: {
        productId: { in: ids },
      },
      include: {
        relatedProduct: {
          include: {
            colors: {
              take: 1,
            },
          },
        },
      },
    });

    // Benzersiz ürünleri döndür ve color images'ı parse et
    const uniqueProducts = combinations
      .map((c) => c.relatedProduct)
      .filter((p, index, self) =>
        index === self.findIndex((t) => t.id === p.id)
      )
      .slice(0, 4)
      .map((product) => {
        // Parse color images
        const colors = product.colors.map((color) => {
          let images: string[] = [];
          if (color.images) {
            try {
              images = typeof color.images === 'string' ? JSON.parse(color.images) : color.images;
            } catch {
              images = [color.images as string];
            }
          }
          return { ...color, images };
        });

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image,
          primaryImage: product.primaryImage,
          colors,
        };
      });

    return NextResponse.json(uniqueProducts);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    return NextResponse.json([], { status: 500 });
  }
}
