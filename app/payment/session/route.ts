import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const ps = await prisma.paymentSession.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        success: true,
        error: true,
        mdStatus: true,
        orderId: true,
        paymentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!ps) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(ps, { status: 200 });
  } catch (err) {
    console.error("[API][payment/session] error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
