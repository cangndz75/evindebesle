import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ps = await prisma.paymentSession.findUnique({ where: { id } });

  if (!ps || !ps.threeDSHtml) {
    return NextResponse.json({ error: "Session bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ html: ps.threeDSHtml });
}
