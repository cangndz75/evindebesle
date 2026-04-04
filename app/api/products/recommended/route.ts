import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TARGET_COUNT = 12;

function formatProduct(product: any) {
  const colors = (product.colors || []).map((color: any) => {
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

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    image: product.image,
    primaryImage: product.primaryImage,
    colors,
  };
}

// Akıllı öneri: kombin > aynı cinsiyet+kategori > aynı cinsiyet > genel
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

    // Sepetteki ürünlerin cinsiyet ve kategorilerini al
    const cartProducts = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, gender: true, categoryId: true },
    });

    const genders = [...new Set(cartProducts.map((p) => p.gender).filter(Boolean))];
    const categoryIds = [...new Set(cartProducts.map((p) => p.categoryId).filter(Boolean))] as string[];

    const excludeIds = new Set(ids);
    const results: any[] = [];

    // 1) Kombin ürünleri (mevcut mantık)
    const combinations = await prisma.productCombination.findMany({
      where: { productId: { in: ids } },
      include: {
        relatedProduct: {
          include: { colors: { take: 1 } },
        },
      },
    });

    for (const c of combinations) {
      const p = c.relatedProduct;
      if (p && p.isActive && p.price > 0 && !excludeIds.has(p.id)) {
        if (!results.find((r) => r.id === p.id)) {
          results.push(formatProduct(p));
          excludeIds.add(p.id);
        }
      }
      if (results.length >= TARGET_COUNT) break;
    }

    // 2) Aynı cinsiyet + aynı kategori
    if (results.length < TARGET_COUNT && genders.length > 0 && categoryIds.length > 0) {
      const sameBoth = await prisma.product.findMany({
        where: {
          id: { notIn: [...excludeIds] },
          isActive: true,
          price: { gt: 0 },
          gender: { in: genders as any },
          categoryId: { in: categoryIds },
        },
        include: { colors: { take: 1 } },
        orderBy: { createdAt: "desc" },
        take: TARGET_COUNT - results.length,
      });
      for (const p of sameBoth) {
        results.push(formatProduct(p));
        excludeIds.add(p.id);
      }
    }

    // 3) Aynı cinsiyet (farklı kategori olabilir)
    if (results.length < TARGET_COUNT && genders.length > 0) {
      const sameGender = await prisma.product.findMany({
        where: {
          id: { notIn: [...excludeIds] },
          isActive: true,
          price: { gt: 0 },
          gender: { in: genders as any },
        },
        include: { colors: { take: 1 } },
        orderBy: { createdAt: "desc" },
        take: TARGET_COUNT - results.length,
      });
      for (const p of sameGender) {
        results.push(formatProduct(p));
        excludeIds.add(p.id);
      }
    }

    // 4) Genel fallback (cinsiyet/kategori eşleşmezse veya yetersizse)
    if (results.length < TARGET_COUNT) {
      const general = await prisma.product.findMany({
        where: {
          id: { notIn: [...excludeIds] },
          isActive: true,
          price: { gt: 0 },
        },
        include: { colors: { take: 1 } },
        orderBy: { createdAt: "desc" },
        take: TARGET_COUNT - results.length,
      });
      for (const p of general) {
        results.push(formatProduct(p));
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    return NextResponse.json([], { status: 500 });
  }
}
