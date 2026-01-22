import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { stock, price } = body;

    const updateData: any = {};
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;

    await prisma.productVariant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Variant update error:", error);
    return NextResponse.json(
      { error: error.message || "Varyant güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
