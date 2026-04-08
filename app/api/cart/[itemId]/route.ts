import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { getRedisCartSnapshot, isRedisCartEnabled, updateRedisCartItemQuantity } from "@/lib/cart-redis";

async function validateCartQuantity(
  productId: string,
  colorId: string | null,
  sizeId: string | null,
  quantity: number
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      isTrackInventory: true,
      allowBackorders: true,
    },
  });

  if (!product) {
    return { ok: false, status: 404, message: "Ürün bulunamadı" };
  }

  if (!product.isTrackInventory || product.allowBackorders) {
    return { ok: true };
  }

  const exactVariant = await prisma.productVariant.findFirst({
    where: {
      productId,
      colorId: colorId || null,
      sizeId: sizeId || null,
    },
    select: { stock: true, stockReserved: true },
  });

  const fallbackVariant = exactVariant
    ? null
    : await prisma.productVariant.findFirst({
      where: {
        productId,
        ...(colorId ? { colorId } : {}),
        ...(sizeId ? { sizeId } : {}),
      },
      select: { stock: true, stockReserved: true },
    });

  const variant = exactVariant || fallbackVariant;

  let availableStock = 0;
  if (variant) {
    availableStock = Math.max(0, (variant.stock || 0) - (variant.stockReserved || 0));
  } else if (sizeId) {
    const size = await prisma.productSize.findUnique({
      where: { id: sizeId },
      select: { stock: true },
    });
    availableStock = Math.max(0, size?.stock || 0);
  }

  if (quantity > availableStock) {
    return {
      ok: false,
      status: 400,
      message: `Bu ürün için maksimum ${availableStock} adet seçebilirsiniz.`,
    };
  }

  return { ok: true };
}

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
    const quantity = Math.max(1, Number(body.quantity) || 0);

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    if (isRedisCartEnabled()) {
      const snapshot = await getRedisCartSnapshot(user.id);
      const targetRedisItem = snapshot.find((item) => item.id === itemId);
      if (!targetRedisItem) {
        return NextResponse.json(
          { error: "Sepet öğesi bulunamadı" },
          { status: 404 }
        );
      }

      const stockValidation = await validateCartQuantity(
        targetRedisItem.productId,
        targetRedisItem.colorId,
        targetRedisItem.sizeId,
        quantity
      );

      if (!stockValidation.ok) {
        return NextResponse.json(
          { error: stockValidation.message },
          { status: stockValidation.status }
        );
      }

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
        select: { id: true, productId: true, colorId: true, sizeId: true },
      });

      if (!targetItem) {
        return NextResponse.json(
          { error: "Sepet öğesi bulunamadı" },
          { status: 404 }
        );
      }

      const stockValidation = await validateCartQuantity(
        targetItem.productId,
        targetItem.colorId,
        targetItem.sizeId,
        quantity
      );

      if (!stockValidation.ok) {
        return NextResponse.json(
          { error: stockValidation.message },
          { status: stockValidation.status }
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
