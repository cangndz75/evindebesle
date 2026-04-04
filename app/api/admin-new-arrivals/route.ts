import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (productId) {
      const item = await prisma.newArrival.findUnique({
        where: { productId },
        include: { product: true }
      });
      return jsonNoStore(item || null);
    }

    const items = await prisma.newArrival.findMany({
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
    console.error("Error fetching new arrival items:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const { productId, order } = body;

    if (!productId) {
      return jsonNoStore({ error: "Product ID gerekli" }, { status: 400 });
    }

    const count = await prisma.newArrival.count();
    
    const existing = await prisma.newArrival.findUnique({
      where: { productId }
    });

    if (existing) {
      return jsonNoStore({ error: "Bu ürün zaten listede!" }, { status: 400 });
    }

    const item = await prisma.newArrival.create({
      data: {
        productId,
        order: order !== undefined ? order : count,
      }
    });

    revalidatePath("/home");
    revalidatePath("/new-arrivals");
    return jsonNoStore(item);
  } catch (error) {
    console.error("Error adding to new arrivals:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return jsonNoStore({ error: "Product ID gerekli" }, { status: 400 });
    }

    await prisma.newArrival.delete({
      where: { productId }
    });

    const remaining = await prisma.newArrival.findMany({ orderBy: { order: "asc" } });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.newArrival.update({
        where: { id: remaining[i].id },
        data: { order: i }
      });
    }

    revalidatePath("/home");
    revalidatePath("/new-arrivals");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("Error removing from new arrivals:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const { items } = body; 

    if (!Array.isArray(items)) {
      return jsonNoStore({ error: "Geçersiz liste numarası." }, { status: 400 });
    }

    for (const item of items) {
       await prisma.newArrival.update({
         where: { id: item.id },
         data: { order: item.order }
       });
    }

    revalidatePath("/home");
    revalidatePath("/new-arrivals");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("Error reordering new arrival items:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}
