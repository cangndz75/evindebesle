import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
       return jsonNoStore({ error: "collectionId gerekli" }, { status: 400 });
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

    return jsonNoStore(items);
  } catch (error) {
    console.error("Error fetching collection items:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const { productId, collectionId, order } = body;

    if (!productId || !collectionId) {
      return jsonNoStore({ error: "Product ID ve Collection ID gerekli" }, { status: 400 });
    }

    const count = await prisma.collectionProduct.count({ where: { collectionId } });

    const existing = await prisma.collectionProduct.findUnique({
      where: { collectionId_productId: { collectionId, productId } }
    });

    if (existing) {
      return jsonNoStore({ error: "Bu Ã¼rÃ¼n zaten bu koleksiyonda!" }, { status: 400 });
    }

    const item = await prisma.collectionProduct.create({
      data: {
        productId,
        collectionId,
        order: order !== undefined ? order : count,
      }
    });

    revalidatePath("/collections");
    return jsonNoStore(item);
  } catch (error) {
    console.error("Error adding to collection:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const collectionId = searchParams.get("collectionId");

    if (!productId || !collectionId) {
      return jsonNoStore({ error: "Gerekli parametreler eksik" }, { status: 400 });
    }

    await prisma.collectionProduct.delete({
      where: { collectionId_productId: { collectionId, productId } }
    });

    const remaining = await prisma.collectionProduct.findMany({ where: { collectionId }, orderBy: { order: "asc" } });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.collectionProduct.update({
        where: { id: remaining[i].id },
        data: { order: i }
      });
    }

    revalidatePath("/collections");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("Error removing from collection:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const { items, collectionId } = body; 

    if (!Array.isArray(items) || !collectionId) {
      return jsonNoStore({ error: "GeÃ§ersiz liste." }, { status: 400 });
    }

    for (const item of items) {
       await prisma.collectionProduct.update({
         where: { id: item.id },
         data: { order: item.order }
       });
    }

    revalidatePath("/collections");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("Error reordering collection items:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}
