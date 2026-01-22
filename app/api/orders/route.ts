import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { Prisma } from "@prisma/client";

// Sipariş numarası oluştur (ORD-YYYYMMDD-XXX formatında)
function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ORD-${dateStr}-${random}`;
}

// GET: Kullanıcının siparişlerini getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
              },
            },
            size: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        shippingAddress: {
          include: {
            district: true,
          },
        },
        billingAddress: {
          include: {
            district: true,
          },
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            value: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Siparişler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// POST: Yeni sipariş oluştur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      shippingAddressId,
      billingAddressId,
      couponId,
      customerNote,
      paymentMethod,
    } = body;

    // Sepeti getir
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: true,
        color: true,
        size: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Sepetiniz boş" },
        { status: 400 }
      );
    }

    // Adres kontrolü
    if (!shippingAddressId) {
      return NextResponse.json(
        { error: "Teslimat adresi seçilmelidir" },
        { status: 400 }
      );
    }

    const shippingAddress = await prisma.userAddress.findUnique({
      where: { id: shippingAddressId },
    });

    if (!shippingAddress || shippingAddress.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Geçersiz teslimat adresi" },
        { status: 400 }
      );
    }

    // Kupon kontrolü (varsa)
    let discount = 0;
    let coupon = null;
    if (couponId) {
      coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon || !coupon.isActive) {
        return NextResponse.json(
          { error: "Geçersiz veya aktif olmayan kupon" },
          { status: 400 }
        );
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "Kupon süresi dolmuş" },
          { status: 400 }
        );
      }
    }

    // Fiyat hesaplamaları
    let subtotal = 0;
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const cartItem of cartItems) {
      const unitPrice = cartItem.product.price;
      const quantity = cartItem.quantity;
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      orderItems.push({
        product: { connect: { id: cartItem.productId } },
        color: cartItem.colorId ? { connect: { id: cartItem.colorId } } : undefined,
        size: cartItem.sizeId ? { connect: { id: cartItem.sizeId } } : undefined,
        productName: cartItem.product.name,
        colorName: cartItem.color?.name || null,

        sizeName: cartItem.size?.name || null,
        image: cartItem.product.image || cartItem.color?.images?.[0] || null,
        quantity,
        unitPrice,
        totalPrice,
      });
    }

    // İndirim hesapla
    if (coupon) {
      if (coupon.discountType === "PERCENT") {
        discount = (subtotal * coupon.value) / 100;
      } else {
        discount = coupon.value;
      }
      // İndirim ara toplamı geçemez
      if (discount > subtotal) {
        discount = subtotal;
      }
    }

    // Kargo ücreti (şimdilik sabit, sonra CompanySettings'ten alınabilir)
    const companySettings = await prisma.companySettings.findFirst();
    const freeShippingThreshold = companySettings?.freeShippingThreshold || 99;
    const shippingCost = subtotal >= freeShippingThreshold ? 0 : 25; // 25 TL kargo

    const total = subtotal - discount + shippingCost;

    // Sipariş oluştur
    const order = await prisma.$transaction(async (tx: any) => {
      // Sipariş numarası oluştur (unique kontrolü ile)
      let orderNumber = generateOrderNumber();
      let exists = null;
      try {
        exists = await tx.order?.findUnique({
          where: { orderNumber },
        });
      } catch (err) {
        console.error("Order findUnique error:", err);
      }
      
      while (exists) {
        orderNumber = generateOrderNumber();
        try {
          exists = await tx.order?.findUnique({
            where: { orderNumber },
          });
        } catch (err) {
          console.error("Order findUnique error:", err);
          break;
        }
      }

      const newOrder = await tx.order?.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: "PENDING",
          paymentStatus: "PENDING",
          subtotal,
          shippingCost,
          discount,
          total,
          shippingAddressId,
          billingAddressId: billingAddressId || shippingAddressId,
          couponId: couponId || null,
          customerNote: customerNote || null,
          paymentMethod: paymentMethod || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
              color: true,
              size: true,
            },
          },
        },
      });

      // Sepeti temizle
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      });

      // Kupon kullanım sayısını artır (varsa)
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            usageCount: { increment: 1 },
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Sipariş oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
