import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { isRedisCartEnabled, updateRedisCartItemQuantity } from "@/lib/cart-redis";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    if (isRedisCartEnabled()) {
      const updated = await updateRedisCartItemQuantity(user.id, itemId, quantity);
      if (!updated) {
        return NextResponse.json(
          { error: "Sepet öğesi bulunamadı" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    }

    try {
      const targetItem = await prisma.cartItem.findFirst({
        where: { id: itemId, userId: user.id },
        select: { id: true },
      });

      if (!targetItem) {
        return NextResponse.json(
          { error: "Sepet öğesi bulunamadı" },
          { status: 404 }
        );
      }

      const updated = await prisma.cartItem.update({
        where: { id: targetItem.id },
        data: { quantity },
        include: {
          product: {
            include: {
              colors: { take: 1 },
              sizes: true,
            },
          },
          color: true,
          size: true,
        },
      });

      return NextResponse.json(updated);
    } catch (prismaError: any) {
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: "Sepet öğesi bulunamadı" },
          { status: 404 }
        );
      }
      throw prismaError; // Diğer hatalar için üst seviyeye fırlat
    }
  } catch (error) {
    console.error("Error updating cart item:", error);
    const errorMessage = error instanceof Error ? error.message : "Sepet öğesi güncellenirken bir hata oluştu";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
