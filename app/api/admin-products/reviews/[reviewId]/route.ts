import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

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

    return jsonNoStore(updated);
  } catch (error: any) {
    console.error("Review update error:", error);
    return jsonNoStore(
      { error: "REVIEW_UPDATE_EXCEPTION" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { reviewId } = await params;

    await prisma.productReview.delete({
      where: { id: reviewId },
    });

    return jsonNoStore({ success: true });
  } catch (error: any) {
    console.error("Review delete error:", error);
    return jsonNoStore(
      { error: "REVIEW_DELETE_EXCEPTION" },
      { status: 500 }
    );
  }
}
