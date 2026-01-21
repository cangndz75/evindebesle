import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Performans için cache - 5 dakika
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // "new-arrivals" | "best-sellers"
    const gender = searchParams.get("gender"); // "MALE" | "FEMALE" | null
    const limit = parseInt(searchParams.get("limit") || "8");

    let products;

    if (type === "new-arrivals") {
      // Yeni gelenler - "yeni ürün" tag'i olanlar
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(gender && { gender: gender as "MALE" | "FEMALE" | "UNISEX" }),
          tags: {
            some: {
              name: {
                in: ["yeni ürün", "yeni", "yeni gelenler", "new", "new arrival"],
              },
            },
          },
        },
        include: {
          colors: {
            take: 1,
            select: {
              images: true,
            },
          },
          tags: {
            select: {
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
      // Çok satanlar - "çok satan" tag'i olanlar veya en çok sipariş edilenler
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(gender && { gender: gender as "MALE" | "FEMALE" | "UNISEX" }),
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
        include: {
          colors: {
            take: 1,
            select: {
              images: true,
            },
          },
          tags: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: [
          {
            orderItems: {
              _count: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        take: limit,
      });
    } else {
      return NextResponse.json(
        { error: "Geçersiz type parametresi" },
        { status: 400 }
      );
    }

    // Format products for frontend
    const formattedProducts = products.map((product) => {
      const firstColor = product.colors[0];
      const colorImages = firstColor?.images || [];
      const mainImage = product.primaryImage || product.image || colorImages[0] || "";
      const hoverImage = product.secondaryImage || colorImages[1] || mainImage;

      return {
        id: product.id,
        title: product.name,
        price: product.price,
        originalPrice: product.originalPrice || undefined,
        image: mainImage,
        hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
        badge: product.originalPrice ? "İndirim" : undefined,
        colors: product.colors.map((c) => c.images[0] || "").filter(Boolean),
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error("Error fetching home products:", error);
    return NextResponse.json(
      { error: "Ürünler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
