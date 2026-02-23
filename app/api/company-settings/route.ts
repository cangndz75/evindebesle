import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/auditLog";

// Firma ayarlarını getir
export async function GET() {
  try {
    const settings = await prisma.companySettings.findFirst();

    if (!settings) {
      // Eğer hiç ayar yoksa varsayılanları döndür
      return NextResponse.json({
        freeShippingThreshold: 99.0,
        shippingPrice: 49.90,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch company settings" },
      { status: 500 }
    );
  }
}

// Firma ayarlarını güncelle (sadece admin)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { freeShippingThreshold, shippingPrice } = body;

    // İlk ayarları oluştur (yoksa)
    let settings = await prisma.companySettings.findFirst();
    const oldSettings = settings ? { ...settings } : null;

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          freeShippingThreshold: freeShippingThreshold || 99.0,
          shippingPrice: shippingPrice || 49.90,
        },
      });
    } else {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          freeShippingThreshold: freeShippingThreshold ?? settings.freeShippingThreshold,
          shippingPrice: shippingPrice ?? settings.shippingPrice,
        },
      });
    }

    // Audit Log
    await logAuditAction({
      action: "SETTINGS_UPDATE",
      adminId: user.id,
      adminEmail: user.email || "",
      targetType: "Settings",
      targetId: settings.id,
      details: {
        oldValue: oldSettings,
        newValue: settings,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { error: "Failed to update company settings" },
      { status: 500 }
    );
  }
}
