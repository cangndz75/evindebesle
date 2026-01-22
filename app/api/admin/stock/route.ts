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
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
      },
    });

    // Stok hesaplama ve filtreleme
    const productsWithStock = products.map((product) => {
      const totalStock = product.sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
      const variants = product.variants.map((v) => ({
        id: v.id,
        colorName: v.color?.name || null,
        sizeName: v.size?.name || null,
        stock: v.stock || 0,
      }));

      return {
        id: product.id,
        name: product.name,
        stockCode: product.stockCode,
        image: product.image,
        price: product.price,
        totalStock,
        minStock: 5, // Varsayılan min stock
        sizes: product.sizes,
        variants,
      };
    });

    // Filtreleme
    let filteredProducts = productsWithStock;
    if (filter === "lowStock") {
      filteredProducts = productsWithStock.filter(
        (p) => p.totalStock > 0 && p.totalStock <= p.minStock
      );
    } else if (filter === "outOfStock") {
      filteredProducts = productsWithStock.filter((p) => p.totalStock === 0);
    }

    // Stok hareketleri (şimdilik boş, ileride OrderItem'lardan hesaplanabilir)
    const movements: any[] = [];

    return NextResponse.json({
      products: filteredProducts,
      movements,
    });
  } catch (error: any) {
    console.error("Stock fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Stok verileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
