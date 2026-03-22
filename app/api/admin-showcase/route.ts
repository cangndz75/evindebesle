import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    const productId = searchParams.get("productId");

    if (productId) {
      // Sadece belirli bir showcase kaydını getir
      const item = await prisma.showcase.findUnique({
        where: { productId },
        include: { product: true }
      });
      return NextResponse.json(item || null);
    }

    // Tüm showcase listesini sıralı şekilde getir
    const items = await prisma.showcase.findMany({
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
    console.error("Error fetching showcase items:", error);
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
    const { productId, order } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID gerekli" }, { status: 400 });
    }

    // Mevcut sayıyı al
    const count = await prisma.showcase.count();
    if (count >= 8) {
      return NextResponse.json({ error: "Vitrine en fazla 8 ürün eklenebilir." }, { status: 400 });
    }

    // Ürün zaten var mı kontrol et
    const existing = await prisma.showcase.findUnique({
      where: { productId }
    });

    if (existing) {
      return NextResponse.json({ error: "Bu ürün zaten vitrinde!" }, { status: 400 });
    }

    const item = await prisma.showcase.create({
      data: {
        productId,
        order: order !== undefined ? order : count,
      }
    });

    revalidatePath("/home");
    return NextResponse.json(item);
  } catch (error) {
    console.error("Error adding to showcase:", error);
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

    if (!productId) {
      return NextResponse.json({ error: "Product ID gerekli" }, { status: 400 });
    }

    await prisma.showcase.delete({
      where: { productId }
    });

    // Kalanların sıralamasını düzelt (isteğe bağlı ama faydalı)
    const remaining = await prisma.showcase.findMany({ orderBy: { order: "asc" } });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.showcase.update({
        where: { id: remaining[i].id },
        data: { order: i }
      });
    }

    revalidatePath("/home");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from showcase:", error);
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
    const { items } = body; // [{ id: string, order: number }]

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Geçersiz liste numarası." }, { status: 400 });
    }

    // Toplu update
    for (const item of items) {
       await prisma.showcase.update({
         where: { id: item.id },
         data: { order: item.order }
       });
    }

    revalidatePath("/home");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering showcase items:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
