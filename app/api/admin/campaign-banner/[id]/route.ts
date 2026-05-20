import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/auditLog";
import {
  normalizeDiscountTiersFromBody,
  parseDiscountTiers,
  parseOptionalDate,
  toAdminCampaignBanner,
} from "@/lib/campaign-banner";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const row = await prisma.campaignBanner.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Kampanya bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(toAdminCampaignBanner(row));
  } catch (error) {
    console.error("Error fetching campaign banner:", error);
    return NextResponse.json({ error: "Yüklenemedi" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.campaignBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kampanya bulunamadı" }, { status: 404 });
    }

    const body = await request.json();
    const tiers = normalizeDiscountTiersFromBody(body.discountTiers);
    const startsAt = parseOptionalDate(body.startsAt);
    const endsAt = parseOptionalDate(body.endsAt);

    if (startsAt !== undefined && endsAt !== undefined && startsAt && endsAt) {
      if (startsAt >= endsAt) {
        return NextResponse.json(
          { error: "Bitiş tarihi başlangıçtan sonra olmalı" },
          { status: 400 }
        );
      }
    }

    const wantsActive = body.isActive === true;
    const tiersForValidation =
      tiers ?? parseDiscountTiers(existing.discountTiers);

    if (wantsActive && tiersForValidation.length === 0) {
      return NextResponse.json(
        { error: "Yayına almak için en az bir indirim kademesi gerekli" },
        { status: 400 }
      );
    }

    const row = await prisma.$transaction(async (tx) => {
      if (wantsActive) {
        await tx.campaignBanner.updateMany({
          where: { id: { not: id }, isActive: true },
          data: { isActive: false },
        });
      }

      return tx.campaignBanner.update({
        where: { id },
        data: {
          ...(typeof body.name === "string" && { name: body.name.trim() }),
          ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
          ...(body.badgeText !== undefined && {
            badgeText:
              body.badgeText === null || body.badgeText === ""
                ? null
                : String(body.badgeText).trim(),
          }),
          ...(typeof body.title === "string" && { title: body.title.trim() }),
          ...(body.description !== undefined && {
            description:
              body.description === null || body.description === ""
                ? null
                : String(body.description).trim(),
          }),
          ...(body.buttonText !== undefined && {
            buttonText:
              body.buttonText === null || body.buttonText === ""
                ? null
                : String(body.buttonText).trim(),
          }),
          ...(body.buttonUrl !== undefined && {
            buttonUrl:
              body.buttonUrl === null || body.buttonUrl === ""
                ? null
                : String(body.buttonUrl).trim(),
          }),
          ...(body.subNote !== undefined && {
            subNote:
              body.subNote === null || body.subNote === ""
                ? null
                : String(body.subNote).trim(),
          }),
          ...(tiers !== null && tiers !== undefined && { discountTiers: tiers }),
          ...(typeof body.themeColor === "string" &&
            ["olive", "dark", "velvet"].includes(body.themeColor) && {
              themeColor: body.themeColor,
            }),
          ...(startsAt !== undefined && { startsAt }),
          ...(endsAt !== undefined && { endsAt }),
        },
      });
    });

    await logAuditAction({
      action: "UPDATE",
      adminId: user.id,
      adminEmail: user.email || "",
      targetType: "CampaignBanner",
      targetId: row.id,
      details: { oldValue: existing, newValue: row },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(toAdminCampaignBanner(row));
  } catch (error) {
    console.error("Error updating campaign banner:", error);
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.campaignBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kampanya bulunamadı" }, { status: 404 });
    }

    await prisma.campaignBanner.delete({ where: { id } });

    await logAuditAction({
      action: "DELETE",
      adminId: user.id,
      adminEmail: user.email || "",
      targetType: "CampaignBanner",
      targetId: id,
      details: { oldValue: existing },
      ipAddress: _request.headers.get("x-forwarded-for") || undefined,
      userAgent: _request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign banner:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
