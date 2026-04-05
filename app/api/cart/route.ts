import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import {
  hydrateRedisCart,
  isRedisCartEnabled,
  removeRedisCartItem,
  upsertRedisCartItem,
  warmRedisCartFromDatabase,
} from "@/lib/cart-redis";

async function getDbCartItems(userId: string) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          image: true,
          primaryImage: true,
          secondaryImage: true,
          slug: true,
          description: true,
          isActive: true,
          categoryId: true,
          gender: true,
        },
      },
      color: {
        select: {
          id: true,
          name: true,
          hexCode: true,
          images: true,
        },
      },
      size: {
        select: {
          id: true,
          name: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return cartItems.map((item: any) => {
    let colorImages: string[] = [];
    if (item.color?.images) {
      try {
        colorImages = typeof item.color.images === "string" ? JSON.parse(item.color.images) : item.color.images;
      } catch {
        colorImages = [item.color.images as string];
      }
    }

    return {
      ...item,
      color: item.color ? { ...item.color, images: colorImages } : null,
    };
  });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isRedisCartEnabled()) {
      const redisItems = await hydrateRedisCart(user.id);
      if (redisItems.length > 0) {
        return NextResponse.json(redisItems);
      }
    }

    const parsedItems = await getDbCartItems(user.id);

    if (isRedisCartEnabled() && parsedItems.length > 0) {
      await warmRedisCartFromDatabase(user.id);
    }

    return NextResponse.json(parsedItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { productId, colorId, sizeId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        colors: { take: 1 },
        sizes: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const color = colorId
      ? await prisma.productColor.findUnique({
        where: { id: colorId },
      })
      : null;
    const size = sizeId
      ? await prisma.productSize.findUnique({
        where: { id: sizeId },
      })
      : null;

    if (user) {
      if (isRedisCartEnabled()) {
        const itemId = await upsertRedisCartItem(user.id, {
          productId,
          colorId: colorId || null,
          sizeId: sizeId || null,
          quantity,
        });

        const items = await hydrateRedisCart(user.id);
        const updated = items.find((item: any) => item.id === itemId) ||
          items.find(
            (item: any) =>
              item.productId === productId &&
              item.colorId === (colorId || null) &&
              item.sizeId === (sizeId || null)
          );

        return NextResponse.json(updated || { id: itemId, userId: user.id });
      }

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: user.id,
          productId,
          colorId: colorId || null,
          sizeId: sizeId || null,
        },
      });

      if (existingItem) {
        const updated = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
                image: true,
                primaryImage: true,
                secondaryImage: true,
                slug: true,
                description: true,
                isActive: true,
                categoryId: true,
                gender: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
                hexCode: true,
                images: true,
              },
            },
            size: {
              select: {
                id: true,
                name: true,
                stock: true,
              },
            },
          },
        });
        return NextResponse.json({ ...updated, userId: user.id });
      } else {
        const newItem = await prisma.cartItem.create({
          data: {
            userId: user.id,
            productId,
            colorId: colorId || null,
            sizeId: sizeId || null,
            quantity,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
                image: true,
                primaryImage: true,
                secondaryImage: true,
                slug: true,
                description: true,
                isActive: true,
                categoryId: true,
                gender: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
                hexCode: true,
                images: true,
              },
            },
            size: {
              select: {
                id: true,
                name: true,
                stock: true,
              },
            },
          },
        });
        return NextResponse.json({ ...newItem, userId: user.id });
      }
    } else {
      return NextResponse.json({
        id: `guest-${Date.now()}`,
        userId: null,
        productId,
        colorId: colorId || null,
        sizeId: sizeId || null,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          originalPrice: product.originalPrice,
          categoryId: product.categoryId,
          gender: product.gender,
        },
        color: color,
        size: size,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    if (isRedisCartEnabled()) {
      await removeRedisCartItem(user.id, itemId);
      return NextResponse.json({ success: true });
    }

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

    await prisma.cartItem.delete({ where: { id: targetItem.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
