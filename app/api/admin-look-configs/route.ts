import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mainProductId = searchParams.get("mainProductId");
  const id = searchParams.get("id");

  try {
    if (id) {
      const config = await prisma.lookConfiguration.findUnique({
        where: { id },
        include: {
          mainProduct: {
            select: { id: true, name: true, image: true, primaryImage: true, price: true }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  stockCode: true,
                  primaryImage: true,
                  image: true,
                  price: true,
                  colors: true,
                }
              }
            },
            orderBy: { order: "asc" }
          }
        }
      });
      return NextResponse.json(config);
    }

    if (mainProductId) {
      const config = await prisma.lookConfiguration.findUnique({
        where: { mainProductId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  stockCode: true,
                  primaryImage: true,
                  image: true,
                  price: true,
                  colors: true,
                }
              }
            },
            orderBy: { order: "asc" }
          }
        }
      });
      return NextResponse.json(config);
    }

    const configs = await prisma.lookConfiguration.findMany({
      include: {
        mainProduct: {
          select: { name: true, stockCode: true }
        },
        _count: { select: { items: true } }
      }
    });
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json({ error: "Veriler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      mainProductId, 
      title, 
      priority, 
      isVisible, 
      showAllAddButton, 
      showTotalPrice, 
      showDiscountBadge,
      status,
      items 
    } = body;

    // Create or Update Configuration
    const config = await prisma.lookConfiguration.upsert({
      where: { mainProductId },
      create: {
        mainProductId,
        title,
        priority: parseInt(priority) || 0,
        isVisible,
        showAllAddButton,
        showTotalPrice,
        showDiscountBadge,
        status,
      },
      update: {
        title,
        priority: parseInt(priority) || 0,
        isVisible,
        showAllAddButton,
        showTotalPrice,
        showDiscountBadge,
        status,
      }
    });

    // Handle Items
    if (items && Array.isArray(items)) {
      // Clear existing items and re-add to maintain order and selection
      await prisma.lookItem.deleteMany({
        where: { lookConfigurationId: config.id }
      });

      if (items.length > 0) {
        await prisma.lookItem.createMany({
          data: items.map((item: any, index: number) => ({
            lookConfigurationId: config.id,
            productId: item.productId,
            order: index
          }))
        });
      }
    }

    revalidatePath("/(public)/products/[slug]", "page");
    revalidatePath("/home");

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Look Config Error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

    await prisma.lookConfiguration.delete({
      where: { id }
    });

    revalidatePath("/home");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
