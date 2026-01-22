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
    const { sizeId, stock } = body;

    if (!sizeId || stock === undefined) {
      return NextResponse.json(
        { error: "sizeId ve stock gerekli" },
        { status: 400 }
      );
    }

    // Size stokunu güncelle
    await prisma.productSize.update({
      where: { id: sizeId },
      data: { stock: parseInt(stock) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Stock update error:", error);
    return NextResponse.json(
      { error: error.message || "Stok güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
