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
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
       return NextResponse.json({ error: "collectionId gerekli" }, { status: 400 });
    }

    const items = await prisma.collectionProduct.findMany({
      where: { collectionId },
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
    console.error("Error fetching collection items:", error);
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
    const { productId, collectionId, order } = body;

    if (!productId || !collectionId) {
      return NextResponse.json({ error: "Product ID ve Collection ID gerekli" }, { status: 400 });
    }

    const count = await prisma.collectionProduct.count({ where: { collectionId } });

    const existing = await prisma.collectionProduct.findUnique({
      where: { collectionId_productId: { collectionId, productId } }
    });

    if (existing) {
      return NextResponse.json({ error: "Bu ürün zaten bu koleksiyonda!" }, { status: 400 });
    }

    const item = await prisma.collectionProduct.create({
      data: {
        productId,
        collectionId,
        order: order !== undefined ? order : count,
      }
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error adding to collection:", error);
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
    const collectionId = searchParams.get("collectionId");

    if (!productId || !collectionId) {
      return NextResponse.json({ error: "Gerekli parametreler eksik" }, { status: 400 });
    }

    await prisma.collectionProduct.delete({
      where: { collectionId_productId: { collectionId, productId } }
    });

    // Reorder
    const remaining = await prisma.collectionProduct.findMany({ where: { collectionId }, orderBy: { order: "asc" } });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.collectionProduct.update({
        where: { id: remaining[i].id },
        data: { order: i }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from collection:", error);
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
    const { items, collectionId } = body; 

    if (!Array.isArray(items) || !collectionId) {
      return NextResponse.json({ error: "Geçersiz liste." }, { status: 400 });
    }

    for (const item of items) {
       await prisma.collectionProduct.update({
         where: { id: item.id },
         data: { order: item.order }
       });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering collection items:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
