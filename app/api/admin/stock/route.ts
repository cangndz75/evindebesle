import { NextRequest, NextResponse } from "next/server";
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

    // Flatten data: Product -> StockItems (Color or Base Product)
    const stockItems: any[] = [];

    for (const product of products) {
      // If product has colors, create an item for each color
      if (product.colors.length > 0) {
        for (const color of product.colors) {
          // Find variants belonging to this color
          const colorVariants = product.variants.filter(
            (v) => v.colorId === color.id
          );

          // Calculate total stock for this color
          const totalStock = colorVariants.reduce(
            (sum, v) => sum + (v.stock || 0),
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
            subVariants: colorVariants.map((v) => ({
              variantId: v.id, // This is ProductVariant ID
              size: v.size?.name || "Standart",
              stock: v.stock,
              isVariant: true,
            })),
          });
        }
      } else {
        // Product has no colors (Size only or Simple)
        const totalStock = product.sizes.reduce(
          (sum, s) => sum + (s.stock || 0),
          0
        );

        // If product has variants but no colors (rare edge case in schema but possible)
        // Or if it has sizes (ProductSize) which are used when no variants exist
        // The schema has ProductSize table which is used for simple size-stock
        // And ProductVariant table for Color-Size combinations.

        // Let's check sizes array
        const subVariants = product.sizes.map((s) => ({
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

    // Filter
    let filteredItems = stockItems;
    if (filter === "lowStock") {
      filteredItems = stockItems.filter(
        (item) => item.totalStock > 0 && item.totalStock <= item.minStock
      );
    } else if (filter === "outOfStock") {
      filteredItems = stockItems.filter((item) => item.totalStock === 0);
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
