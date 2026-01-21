import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

// Widget pozisyonlarını getir
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const userId = session.user.id;

    // Kullanıcının widget'larını getir, yoksa default'ları oluştur
    let widgets = await prisma.dashboardWidget.findMany({
      where: { userId },
      orderBy: { position: "asc" },
    });

    // Eğer widget yoksa, default widget'ları oluştur
    if (widgets.length === 0) {
      const defaultWidgets = [
        { widgetKey: "todayRevenue", position: 0 },
        { widgetKey: "todayOrders", position: 1 },
        { widgetKey: "aov", position: 2 },
        { widgetKey: "cancellationRate", position: 3 },
      ];

      widgets = await Promise.all(
        defaultWidgets.map((w) =>
          prisma.dashboardWidget.create({
            data: {
              userId,
              widgetKey: w.widgetKey,
              position: w.position,
            },
          })
        )
      );
    }

    return NextResponse.json(widgets);
  } catch (error: any) {
    console.error("Error fetching dashboard widgets:", error);
    return NextResponse.json(
      { error: error.message || "Widget'lar yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Widget pozisyonlarını güncelle
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const userId = session.user.id;
    const { widgets } = await req.json();

    if (!Array.isArray(widgets)) {
      return NextResponse.json(
        { error: "Geçersiz widget verisi" },
        { status: 400 }
      );
    }

    // Tüm widget pozisyonlarını güncelle
    await Promise.all(
      widgets.map((widget: { id: string; position: number }) =>
        prisma.dashboardWidget.update({
          where: { id: widget.id },
          data: { position: widget.position },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating dashboard widgets:", error);
    return NextResponse.json(
      { error: error.message || "Widget pozisyonları güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
