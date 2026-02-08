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

    // Parse color images JSON strings
    const parsedItems = cartItems.map((item: any) => {
      // Parse selected color images
      let colorImages: string[] = [];
      if (item.color?.images) {
        try {
          colorImages = typeof item.color.images === 'string' ? JSON.parse(item.color.images) : item.color.images;
        } catch {
          colorImages = [item.color.images as string];
        }
      }

      return {
        ...item,
        color: item.color ? { ...item.color, images: colorImages } : null,
      };
    });

    return NextResponse.json(parsedItems);
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
      // findFirst kullan çünkü colorId veya sizeId null olabilir (composite key null kabul etmez)
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: user.id,
          productId,
          colorId: colorId || null,
          sizeId: sizeId || null,
        },
      });

      if (existingItem) {
        // Varsa miktarı artır
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
          originalPrice: product.originalPrice,
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
