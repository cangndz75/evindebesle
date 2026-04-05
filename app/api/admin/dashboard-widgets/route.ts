import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const userId = session.user.id;

    let widgets = await prisma.dashboardWidget.findMany({
      where: { userId },
      orderBy: { position: "asc" },
    });

    if (widgets.length === 0) {
      const defaultWidgets = [
        { widgetKey: "todayRevenue", position: 0 },
        { widgetKey: "todayOrders", position: 1 },
        { widgetKey: "aov", position: 2 },
        { widgetKey: "cancellationRate", position: 3 },
      ];

      widgets = await Promise.all(
        defaultWidgets.map((w: any) =>
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
