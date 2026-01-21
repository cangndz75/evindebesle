import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "best-selling"; // "best-selling", "recent", "low-stock"

    if (type === "best-selling") {
      // En çok satan ürünler (siparişlerden)
      const bestSelling = await prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 10,
      });

      const productIds = bestSelling.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          slug: true,
        },
      });

      const productsWithSales = products.map((product) => {
        const salesData = bestSelling.find((s) => s.productId === product.id);
        return {
          ...product,
          totalSold: salesData?._sum.quantity || 0,
        };
      });

      return NextResponse.json(productsWithSales.sort((a, b) => b.totalSold - a.totalSold));
    } else if (type === "recent") {
      // Son eklenen ürünler
      const recentProducts = await prisma.product.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          slug: true,
          createdAt: true,
        },
      });

      return NextResponse.json(recentProducts);
    } else if (type === "low-stock") {
      // Düşük stoklu ürünler
      const lowStockProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          sizes: {
            some: {
              stock: { lte: 10, gt: 0 },
            },
          },
        },
        include: {
          sizes: true,
        },
        take: 10,
        orderBy: {
          updatedAt: "desc",
        },
      });

      const productsWithStock = lowStockProducts.map((product) => {
        const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
        return {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          slug: product.slug,
          stock: totalStock,
        };
      });

      return NextResponse.json(productsWithStock);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("Dashboard products error:", error);
    return NextResponse.json(
      { error: error.message || "Ürünler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
