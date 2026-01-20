import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Ürün yorumlarını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const approvedOnly = searchParams.get("approved") === "true";

    const reviews = await prisma.productReview.findMany({
      where: {
        productId: id,
        ...(approvedOnly && { isApproved: true }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Yorumlar yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Yeni yorum ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, userName, rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Puan 1-5 arasında olmalıdır" },
        { status: 400 }
      );
    }

    const review = await prisma.productReview.create({
      data: {
        productId: id,
        userId: userId || undefined,
        userName: userName || undefined,
        rating: parseInt(rating),
        comment: comment || undefined,
        isApproved: false, // Admin onayı gerekli
      },
    });

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { error: error.message || "Yorum eklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
