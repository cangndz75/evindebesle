import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";

// Sepeti getir
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            colors: {
              take: 1,
            },
            sizes: true,
          },
        },
        color: true,
        size: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// Sepete ürün ekle
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

    // Ürün bilgilerini getir (giriş yapmadan da gerekli)
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

    // Renk ve beden bilgilerini getir
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

    // Giriş yapmış kullanıcı için veritabanına kaydet
    if (user) {
      // Aynı ürün, renk ve beden kombinasyonunu kontrol et
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId_colorId_sizeId: {
            userId: user.id,
            productId,
            colorId: colorId || null,
            sizeId: sizeId || null,
          },
        },
      });

      if (existingItem) {
        // Varsa miktarı artır
        const updated = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
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
        return NextResponse.json({ ...updated, userId: user.id });
      } else {
        // Yoksa yeni ekle
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
              include: {
                colors: { take: 1 },
                sizes: true,
              },
            },
            color: true,
            size: true,
          },
        });
        return NextResponse.json({ ...newItem, userId: user.id });
      }
    } else {
      // Giriş yapmamış kullanıcı için sadece ürün bilgilerini döndür
      // Frontend localStorage'a kaydedecek
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
          colors: product.colors,
          sizes: product.sizes,
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

// Sepetten ürün sil
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

    // Kullanıcının kendi sepetindeki ürünü sil
    await prisma.cartItem.delete({
      where: {
        id: itemId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
