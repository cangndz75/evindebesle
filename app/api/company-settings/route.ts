import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/auditLog";

export async function GET() {
  try {
    const settings = await prisma.companySettings.findFirst();

    if (!settings) {
      return NextResponse.json({
        freeShippingThreshold: 99.0,
        shippingPrice: 49.90,
        companyName: "Dark Velvet",
        companyAddress: "",
        taxOffice: "",
        taxNumber: "",
        phone: "",
        email: "",
        logoUrl: "",
        website: "",
        deliveryTimes: [
          {
            title: "İstanbul İçi",
            time: "1-2 iş günü",
            note: "Saat 14:00'e kadar verilen siparişler aynı gün kargoya verilir.",
          },
          {
            title: "Büyükşehirler",
            time: "2-3 iş günü",
            note: "Ankara, İzmir, Bursa, Antalya ve diğer büyükşehirler.",
          },
          {
            title: "Diğer İller",
            time: "3-5 iş günü",
            note: "Kırsal bölgelerde teslimat süreleri uzayabilir.",
          },
        ],
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

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      freeShippingThreshold,
      shippingPrice,
      companyName,
      companyAddress,
      taxOffice,
      taxNumber,
      phone,
      email,
      logoUrl,
      website,
      deliveryTimes,
    } = body;

    let settings = await prisma.companySettings.findFirst();
    const oldSettings = settings ? { ...settings } : null;

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          freeShippingThreshold: freeShippingThreshold || 99.0,
          shippingPrice: shippingPrice || 49.90,
          companyName: companyName ?? "Dark Velvet",
          companyAddress: companyAddress ?? "",
          taxOffice: taxOffice ?? "",
          taxNumber: taxNumber ?? "",
          phone: phone ?? "",
          email: email ?? "",
          logoUrl: logoUrl ?? "",
          website: website ?? "",
          deliveryTimes: Array.isArray(deliveryTimes) ? deliveryTimes : [],
        },
      });
    } else {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          freeShippingThreshold: freeShippingThreshold ?? settings.freeShippingThreshold,
          shippingPrice: shippingPrice ?? settings.shippingPrice,
          companyName: companyName ?? settings.companyName,
          companyAddress: companyAddress ?? settings.companyAddress,
          taxOffice: taxOffice ?? settings.taxOffice,
          taxNumber: taxNumber ?? settings.taxNumber,
          phone: phone ?? settings.phone,
          email: email ?? settings.email,
          logoUrl: logoUrl ?? settings.logoUrl,
          website: website ?? settings.website,
          deliveryTimes: Array.isArray(deliveryTimes) ? deliveryTimes : settings.deliveryTimes,
        },
      });
    }

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
