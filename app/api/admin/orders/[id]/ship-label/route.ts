import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { createShipmentLabelForOrder } from "@/lib/services/cargo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = await params;

    const result = await createShipmentLabelForOrder({
      orderId: id,
      cargoCompanyCode: typeof body?.cargoCompanyCode === "string" ? body.cargoCompanyCode : undefined,
      handlerCode: typeof body?.handlerCode === "string" ? body.handlerCode : undefined,
      performedById: session.user.id,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[ORDER_SHIP_LABEL_POST]", error);
    return NextResponse.json(
      { error: error?.message || "Kargo barkodu oluşturulamadı" },
      { status: 500 }
    );
  }
}
