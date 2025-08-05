import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const statusCounts = await prisma.appointment.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusLabels: Record<string, string> = {
    SCHEDULED: "Bekliyor",
    COMPLETED: "Tamamlandı",
    CANCELED: "İptal",
    MISSED: "Kaçırıldı",
  };

  const response = statusCounts.map((item) => ({
    name: statusLabels[item.status] || item.status,
    value: item._count,
  }));

  return NextResponse.json(response);
}
