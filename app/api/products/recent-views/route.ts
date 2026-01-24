import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Kullanıcının son görüntülediği ürünleri getir
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ products: [] });
    }

    // Son 20 görüntülenen ürünü getir (tekrar edenleri en son görüntülenenle değiştir)
    const views = await prisma.productViewHistory.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            colors: {
              take: 1,
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 20,
    });

    // Tekrar eden ürünleri kaldır (en son görüntülenen kalır)
    const uniqueProducts = new Map();
    views.forEach((view) => {
      if (!uniqueProducts.has(view.productId)) {
        // Parse color images if they exist
        const product = view.product;
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

        uniqueProducts.set(view.productId, {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image,
          primaryImage: product.primaryImage,
          colors,
        });
      }
    });

    const products = Array.from(uniqueProducts.values());

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching recent views:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
