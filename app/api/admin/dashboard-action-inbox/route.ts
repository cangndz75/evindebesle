import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { subHours } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    // Prisma client kontrolü
    if (!prisma || !prisma.order) {
      console.error("Prisma client veya order modeli bulunamadı");
      return NextResponse.json(
        { error: "Veritabanı bağlantı hatası", items: [] },
        { status: 500 }
      );
    }

    const oneHourAgo = subHours(new Date(), 1);

    // Kargoya hazır siparişler
    const readyToShip = await prisma.order.count({
      where: {
        status: "PREPARING",
        paymentStatus: "PAID",
      },
    });

    // Ödeme hatası olan siparişler
    const paymentFailed = await prisma.order.count({
      where: {
        paymentStatus: "FAILED",
        createdAt: { gte: oneHourAgo },
      },
    });

    // Düşük stoklu ürünler (< 3 adet)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        sizes: {
          some: {
            stock: { lte: 3, gt: 0 },
          },
        },
      },
      include: {
        sizes: true,
      },
    });

    const lowStockCount = lowStockProducts.length;

    // İade talepleri (şimdilik iptal edilen siparişler)
    const refundRequests = await prisma.order.count({
      where: {
        paymentStatus: "REFUNDED",
        createdAt: { gte: oneHourAgo },
      },
    });

    // Bugünkü randevular
    const todayAppointments = await prisma.appointment.count({
      where: {
        confirmedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { in: ["SCHEDULED"] },
      },
    });

    // Yaklaşan randevular (24 saat içinde)
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        confirmedAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        status: { in: ["SCHEDULED"] },
      },
    });

    // İptal edilen randevular (bugün - confirmedAt'a göre)
    const cancelledAppointments = await prisma.appointment.count({
      where: {
        confirmedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        status: "CANCELED",
      },
    });

    return NextResponse.json({
      readyToShip,
      paymentFailed,
      lowStockCount,
      refundRequests,
      todayAppointments,
      upcomingAppointments,
      cancelledAppointments,
      items: [
        ...(readyToShip > 0 ? [{
          type: "ready_to_ship",
          count: readyToShip,
          label: `${readyToShip} sipariş kargoya hazır`,
          action: "/admin-orders?status=PREPARING",
          priority: "high",
        }] : []),
        ...(paymentFailed > 0 ? [{
          type: "payment_failed",
          count: paymentFailed,
          label: `${paymentFailed} sipariş ödeme hatası`,
          action: "/admin-orders?paymentStatus=FAILED",
          priority: "high",
        }] : []),
        ...(lowStockCount > 0 ? [{
          type: "low_stock",
          count: lowStockCount,
          label: `${lowStockCount} üründe stok < 3`,
          action: "/admin-products?stockStatus=lowStock",
          priority: "medium",
        }] : []),
        ...(refundRequests > 0 ? [{
          type: "refund_request",
          count: refundRequests,
          label: `${refundRequests} iade talebi bekliyor`,
          action: "/admin-orders?paymentStatus=REFUNDED",
          priority: "medium",
        }] : []),
        ...(todayAppointments > 0 ? [{
          type: "today_appointments",
          count: todayAppointments,
          label: `${todayAppointments} randevu bugün`,
          action: "/admin-appointments?date=today",
          priority: "low",
        }] : []),
        ...(upcomingAppointments > 0 ? [{
          type: "upcoming_appointments",
          count: upcomingAppointments,
          label: `${upcomingAppointments} randevu yaklaşıyor`,
          action: "/admin-appointments?date=upcoming",
          priority: "low",
        }] : []),
        ...(cancelledAppointments > 0 ? [{
          type: "cancelled_appointments",
          count: cancelledAppointments,
          label: `${cancelledAppointments} randevu iptal edildi`,
          action: "/admin-appointments?status=CANCELED",
          priority: "low",
        }] : []),
      ],
    });
  } catch (error: any) {
    console.error("Action inbox error:", error);
    return NextResponse.json(
      { error: error.message || "Action inbox yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
