import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search");

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { stockCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        sizes: true,
        colors: true,
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
      },
    });

    const stockItems: any[] = [];

    for (const product of products) {
      if (product.colors.length > 0) {
        for (const color of product.colors) {
          const colorVariants = product.variants.filter(
            (v: any) => v.colorId === color.id
          );

          const totalStock = colorVariants.reduce(
            (sum: number, v: any) => sum + (v.stock || v.size?.stock || 0),
            0
          );

          stockItems.push({
            docId: `${product.id}_${color.id}`,
            productId: product.id,
            productName: product.name,
            colorId: color.id,
            colorName: color.name,
            image: product.image, // Could be color specific image if available
            stockCode: product.stockCode, // Base stock code
            totalStock,
            minStock: 5,
            subVariants: colorVariants.map((v: any) => ({
              variantId: v.id, // This is ProductVariant ID
              size: v.size?.name || "Standart",
              stock: v.stock || v.size?.stock || 0,
              isVariant: true,
            })),
          });
        }
      } else {
        const totalStock = product.sizes.reduce(
          (sum: number, s: any) => sum + (s.stock || 0),
          0
        );


        const subVariants = product.sizes.map((s: any) => ({
          variantId: s.id, // This is ProductSize ID
          size: s.name,
          stock: s.stock,
          isVariant: false, // It's from ProductSize table
        }));

        stockItems.push({
          docId: `${product.id}_base`,
          productId: product.id,
          productName: product.name,
          colorId: null,
          colorName: null,
          image: product.image,
          stockCode: product.stockCode,
          totalStock,
          minStock: 5,
          subVariants: subVariants,
        });
      }
    }

    let filteredItems = stockItems;
    if (filter === "lowStock") {
      filteredItems = stockItems.filter(
        (item: any) => item.totalStock > 0 && item.totalStock <= item.minStock
      );
    } else if (filter === "outOfStock") {
      filteredItems = stockItems.filter((item: any) => item.totalStock === 0);
    }

    return NextResponse.json({
      products: filteredItems, // Keep key 'products' for compatibility or rename to 'items'
      movements: [],
    });
  } catch (error: any) {
    console.error("Stock fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Stok verileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
