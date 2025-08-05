import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const logs = await prisma.notificationLog.findMany({
    include: { user: true },
    orderBy: { sentAt: "desc" },
    take: 20,
  });

  return NextResponse.json(logs);
}
