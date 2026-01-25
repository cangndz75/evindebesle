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
    const type = searchParams.get("type") || "low"; // "low" or "out"

    let products;

    if (type === "out") {
      // Tükendi
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          sizes: {
            every: {
              stock: 0,
            },
          },
        },
        include: {
          sizes: true,
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      });
    } else {
      // Düşük stok (10 ve altı)
      products = await prisma.product.findMany({
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
        orderBy: { updatedAt: "desc" },
      });
    }

    const productsWithStock = products.map((product: any) => {
      const totalStock = product.sizes.reduce((sum: number, s: any) => sum + s.stock, 0);
      return {
        id: product.id,
        name: product.name,
        image: product.image,
        stock: totalStock,
        sizes: product.sizes.map((s: any) => ({
          name: s.name,
          stock: s.stock,
        })),
      };
    });

    return NextResponse.json(productsWithStock);
  } catch (error: any) {
    console.error("Stock alert error:", error);
    return NextResponse.json(
      { error: error.message || "Stok bilgileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
