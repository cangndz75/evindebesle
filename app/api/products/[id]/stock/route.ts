import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const colorId = searchParams.get("colorId");
    const sizeId = searchParams.get("sizeId");

    // Önce variant'tan stok kontrolü yap
    if (colorId && sizeId) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          productId: id,
          colorId: colorId,
          sizeId: sizeId,
        },
        select: {
          stock: true,
        },
      });

      if (variant) {
        return NextResponse.json({ stock: variant.stock });
      }
    }

    // Variant yoksa size'tan stok kontrolü yap
    if (sizeId) {
      const size = await prisma.productSize.findFirst({
        where: {
          productId: id,
          id: sizeId,
        },
        select: {
          stock: true,
        },
      });

      if (size) {
        return NextResponse.json({ stock: size.stock });
      }
    }

    // Hiçbiri yoksa ürünün toplam stokunu döndür
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        sizes: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
    return NextResponse.json({ stock: totalStock });
  } catch (error: any) {
    console.error("Stock check error:", error);
    return NextResponse.json(
      { error: error.message || "Stok kontrolü yapılırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
