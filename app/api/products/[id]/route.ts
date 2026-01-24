import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Public endpoint - Ürün detaylarını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { 
        id,
        isActive: true, // Sadece aktif ürünler
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        detailText: true,
        price: true,
        originalPrice: true,
        image: true,
        primaryImage: true,
        secondaryImage: true,
        colors: {
          select: {
            id: true,
            name: true,
            hexCode: true,
            images: true,
            variants: {
              select: {
                id: true,
                variantCode: true,
                colorId: true,
                sizeId: true,
                stock: true,
                price: true,
              },
            },
          },
        },
        sizes: {
          select: {
            id: true,
            name: true,
            stock: true,
          },
        },
        sizeOptions: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    const response = NextResponse.json(product);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error: any) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
