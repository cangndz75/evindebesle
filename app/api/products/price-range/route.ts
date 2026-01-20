import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await prisma.product.aggregate({
      where: {
        isActive: true,
      },
      _min: {
        price: true,
      },
      _max: {
        price: true,
      },
    });

    return NextResponse.json({
      min: result._min.price || 0,
      max: result._max.price || 2000,
    });
  } catch (error) {
    console.error("Fiyat aralığı hesaplanırken hata:", error);
    return NextResponse.json({ min: 0, max: 2000 });
  }
}
