import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { syncSizeStocksFromVariants } from "@/lib/stock";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { stock, price } = body;

    const currentVariant = await prisma.productVariant.findUnique({
      where: { id },
      select: { id: true, stock: true, productId: true },
    });

    if (!currentVariant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;

    await prisma.productVariant.update({
      where: { id },
      data: updateData,
    });

    if (stock !== undefined) {
      const nextStock = parseInt(stock);
      const diff = nextStock - (currentVariant.stock || 0);

      if (diff !== 0) {
        await prisma.stockMovement.create({
          data: {
            productId: currentVariant.productId,
            variantId: currentVariant.id,
            quantity: Math.abs(diff),
            type: "ADJUSTMENT",
            reason: "Admin variant stock update",
            userId: session.user.id,
          },
        });
      }

      await syncSizeStocksFromVariants(currentVariant.productId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Variant update error:", error);
    return NextResponse.json(
      { error: error.message || "Varyant güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
