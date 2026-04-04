import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

// Ürün yorumlarını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

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

    return jsonNoStore(reviews);
  } catch (error: any) {
    console.error("Reviews fetch error:", error);
    return jsonNoStore(
      { error: "REVIEWS_FETCH_EXCEPTION" },
      { status: 500 }
    );
  }
}

// Yeni yorum ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, userName, rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return jsonNoStore(
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

    return jsonNoStore(review);
  } catch (error: any) {
    console.error("Review creation error:", error);
    return jsonNoStore(
      { error: "REVIEW_CREATE_EXCEPTION" },
      { status: 500 }
    );
  }
}
