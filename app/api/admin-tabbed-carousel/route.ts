import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tabOption = searchParams.get("tab") || "new-arrivals";

    const items = await prisma.tabbedCarouselProduct.findMany({
      where: { tab: tabOption },
      orderBy: { order: "asc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            stockCode: true,
            price: true,
            image: true,
            primaryImage: true,
            colors: {
              select: { images: true }
            }
          }
        }
      }
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching tab items:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, tab, order } = body;

    if (!productId || !tab) {
      return NextResponse.json({ error: "Product ID ve Tab gerekli" }, { status: 400 });
    }

    const count = await prisma.tabbedCarouselProduct.count({ where: { tab } });
    if (count >= 15) {
      return NextResponse.json({ error: "Bu sekmeye en fazla 15 ürün eklenebilir." }, { status: 400 });
    }

    const existing = await prisma.tabbedCarouselProduct.findUnique({
      where: { tab_productId: { tab, productId } }
    });

    if (existing) {
      return NextResponse.json({ error: "Bu ürün zaten bu sekmede!" }, { status: 400 });
    }

    const item = await prisma.tabbedCarouselProduct.create({
      data: {
        productId,
        tab,
        order: order !== undefined ? order : count,
      }
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error adding to tab:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const tab = searchParams.get("tab");

    if (!productId || !tab) {
      return NextResponse.json({ error: "Gerekli parametreler eksik" }, { status: 400 });
    }

    await prisma.tabbedCarouselProduct.delete({
      where: { tab_productId: { tab, productId } }
    });

    // Reorder
    const remaining = await prisma.tabbedCarouselProduct.findMany({ where: { tab }, orderBy: { order: "asc" } });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.tabbedCarouselProduct.update({
        where: { id: remaining[i].id },
        data: { order: i }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from tab:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, tab } = body; 

    if (!Array.isArray(items) || !tab) {
      return NextResponse.json({ error: "Geçersiz liste veya tab." }, { status: 400 });
    }

    for (const item of items) {
       await prisma.tabbedCarouselProduct.update({
         where: { id: item.id }, // Burada tab_productId'yi kontrol etmeye gerek yok çünkü id unique.
         data: { order: item.order }
       });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tab items:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
