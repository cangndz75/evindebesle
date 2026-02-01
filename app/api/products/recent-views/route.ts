import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Kullanıcının son görüntülediği ürünleri getir
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    const localIds = idsParam ? idsParam.split(",").filter((id) => id) : [];

    let dbProducts: any[] = [];
    let userHistoryProducts: any[] = [];

    // 1. LocalStorage'daki ID'leri database'den çek (validasyon)
    if (localIds.length > 0) {
      dbProducts = await prisma.product.findMany({
        where: {
          id: { in: localIds },
          // Eğer soft delete varsa buraya deletedAt: null gibi bir kontrol eklenebilir
          // isActive: true, // İsteğe bağlı
        },
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
      });
    }

    // 2. Kullanıcı giriş yapmışsa geçmişini çek
    if (user) {
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
      userHistoryProducts = views.map((v: any) => v.product);
    }

    // 3. Listeleri birleştir
    // Öncelik: Kullanıcı geçmişi (daha güncel olabilir) -> LocalStorage valid ürünler
    // Ancak sıralama "en son görüntülenen" şeklinde olmalı.
    // Local data'nın zaman bilgisi sunucuya gelmediği için, biz
    // "Kullanıcı geçmişi" + "Local data (API'de olmayanlar)" şeklinde birleştirebiliriz.
    // Veya basitçe hepsini bir havuza atıp unique yaparız.

    const allProducts = [...userHistoryProducts, ...dbProducts];
    const uniqueMap = new Map();

    allProducts.forEach((product) => {
      if (!product) return;
      if (!uniqueMap.has(product.id)) {
        // Parse color images if they exist
        const colors = product.colors?.map((color: any) => {
          let images: string[] = [];
          if (color.images) {
            try {
              images = typeof color.images === "string" ? JSON.parse(color.images) : color.images;
            } catch {
              images = [color.images as string];
            }
          }
          return { ...color, images };
        });

        uniqueMap.set(product.id, {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image,
          primaryImage: product.primaryImage,
          colors: colors || [],
        });
      }
    });

    const products = Array.from(uniqueMap.values());

    // Eğer sadece local data varsa, client'taki sırayı korumak zor olabilir çünkü DB'den karışık gelebilir.
    // Ancak client zaten kendi sırasını biliyor olabilir.
    // Yine de burada "valid" ürünleri döndürmemiz yeterli.

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching recent views:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
