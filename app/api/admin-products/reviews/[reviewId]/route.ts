import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Yorumu güncelle (onaylama/reddetme)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();
    const { isApproved, comment, rating } = body;

    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        ...(isApproved !== undefined && { isApproved }),
        ...(comment !== undefined && { comment }),
        ...(rating !== undefined && { rating: parseInt(rating) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Review update error:", error);
    return NextResponse.json(
      { error: error.message || "Yorum güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Yorumu sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

    await prisma.productReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Review delete error:", error);
    return NextResponse.json(
      { error: error.message || "Yorum silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
