import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
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

    return jsonNoStore(items);
  } catch (error) {
    console.error("Error fetching tab items:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const { productId, tab, order } = body;

    if (!productId || !tab) {
      return jsonNoStore({ error: "Product ID ve Tab gerekli" }, { status: 400 });
    }

    const count = await prisma.tabbedCarouselProduct.count({ where: { tab } });
    if (count >= 15) {
      return jsonNoStore({ error: "Bu sekmeye en fazla 15 Ã¼rÃ¼n eklenebilir." }, { status: 400 });
    }

    const existing = await prisma.tabbedCarouselProduct.findUnique({
      where: { tab_productId: { tab, productId } }
    });

    if (existing) {
      return jsonNoStore({ error: "Bu Ã¼rÃ¼n zaten bu sekmede!" }, { status: 400 });
    }

    const item = await prisma.tabbedCarouselProduct.create({
      data: {
        productId,
        tab,
        order: order !== undefined ? order : count,
      }
    });

    revalidatePath("/home");
    return jsonNoStore(item);
  } catch (error) {
    console.error("Error adding to tab:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const tab = searchParams.get("tab");

    if (!productId || !tab) {
      return jsonNoStore({ error: "Gerekli parametreler eksik" }, { status: 400 });
    }

    await prisma.tabbedCarouselProduct.delete({
      where: { tab_productId: { tab, productId } }
    });

    const remaining = await prisma.tabbedCarouselProduct.findMany({ where: { tab }, orderBy: { order: "asc" } });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.tabbedCarouselProduct.update({
        where: { id: remaining[i].id },
        data: { order: i }
      });
    }

    revalidatePath("/home");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("Error removing from tab:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const { items, tab } = body; 

    if (!Array.isArray(items) || !tab) {
      return jsonNoStore({ error: "GeÃ§ersiz liste veya tab." }, { status: 400 });
    }

    for (const item of items) {
       await prisma.tabbedCarouselProduct.update({
         where: { id: item.id }, // Burada tab_productId'yi kontrol etmeye gerek yok Ã§Ã¼nkÃ¼ id unique.
         data: { order: item.order }
       });
    }

    revalidatePath("/home");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("Error reordering tab items:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}
