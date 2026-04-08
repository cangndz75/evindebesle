import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sizeId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sizeId } = await params;
    const body = await request.json();
    const { stock } = body;

    const existingSize = await prisma.productSize.findUnique({
      where: { id: sizeId },
      select: { id: true, stock: true, productId: true },
    });

    if (!existingSize) {
      return NextResponse.json({ error: "Size not found" }, { status: 404 });
    }

    const newStock = parseInt(stock);

    await prisma.productSize.update({
      where: { id: sizeId },
      data: { stock: newStock },
    });

    const diff = newStock - (existingSize.stock || 0);
    if (diff !== 0) {
      await prisma.stockMovement.create({
        data: {
          productId: existingSize.productId,
          quantity: Math.abs(diff),
          type: "ADJUSTMENT",
          reason: "Admin size stock update",
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Size update error:", error);
    return NextResponse.json(
      { error: error.message || "Stok güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
