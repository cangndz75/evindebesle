import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/auditLog";
import {
  DEFAULT_WELCOME_POPUP_SETTINGS,
  toPublicWelcomePopupSettings,
} from "@/lib/welcome-popup";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.welcomePopupSettings.findFirst();
    return NextResponse.json(
      settings
        ? { id: settings.id, ...toPublicWelcomePopupSettings(settings) }
        : { ...DEFAULT_WELCOME_POPUP_SETTINGS }
    );
  } catch (error) {
    console.error("Error fetching welcome popup admin settings:", error);
    return NextResponse.json(
      { error: "Ayarlar yüklenemedi" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      isEnabled,
      delayMs,
      title,
      description,
      emailPlaceholder,
      consentText,
      buttonText,
      imageUrl,
      showEmailForm,
      discountType,
      discountValue,
      codePrefix,
      couponValidDays,
      emailSubject,
      successTitle,
      successMessage,
    } = body;

    const data = {
      isEnabled: typeof isEnabled === "boolean" ? isEnabled : undefined,
      delayMs:
        typeof delayMs === "number" && delayMs >= 0 && delayMs <= 60000
          ? Math.round(delayMs)
          : undefined,
      title: typeof title === "string" ? title.trim() : undefined,
      description:
        typeof description === "string" ? description.trim() : undefined,
      emailPlaceholder:
        typeof emailPlaceholder === "string"
          ? emailPlaceholder.trim()
          : undefined,
      consentText:
        typeof consentText === "string" ? consentText.trim() : undefined,
      buttonText:
        typeof buttonText === "string" ? buttonText.trim() : undefined,
      imageUrl:
        imageUrl === null || imageUrl === ""
          ? null
          : typeof imageUrl === "string"
            ? imageUrl.trim()
            : undefined,
      showEmailForm:
        typeof showEmailForm === "boolean" ? showEmailForm : undefined,
      discountType:
        discountType === "PERCENT" || discountType === "AMOUNT"
          ? discountType
          : undefined,
      discountValue:
        typeof discountValue === "number" && discountValue > 0
          ? Math.round(discountValue)
          : undefined,
      codePrefix:
        typeof codePrefix === "string" ? codePrefix.trim().toUpperCase() : undefined,
      couponValidDays:
        typeof couponValidDays === "number" &&
        couponValidDays >= 1 &&
        couponValidDays <= 365
          ? Math.round(couponValidDays)
          : undefined,
      emailSubject:
        typeof emailSubject === "string" ? emailSubject.trim() : undefined,
      successTitle:
        typeof successTitle === "string" ? successTitle.trim() : undefined,
      successMessage:
        typeof successMessage === "string" ? successMessage.trim() : undefined,
    };

    let settings = await prisma.welcomePopupSettings.findFirst();
    const oldSettings = settings ? { ...settings } : null;

    if (!settings) {
      settings = await prisma.welcomePopupSettings.create({
        data: {
          isEnabled: data.isEnabled ?? DEFAULT_WELCOME_POPUP_SETTINGS.isEnabled,
          delayMs: data.delayMs ?? DEFAULT_WELCOME_POPUP_SETTINGS.delayMs,
          title: data.title ?? DEFAULT_WELCOME_POPUP_SETTINGS.title,
          description:
            data.description ?? DEFAULT_WELCOME_POPUP_SETTINGS.description,
          emailPlaceholder:
            data.emailPlaceholder ??
            DEFAULT_WELCOME_POPUP_SETTINGS.emailPlaceholder,
          consentText:
            data.consentText ?? DEFAULT_WELCOME_POPUP_SETTINGS.consentText,
          buttonText:
            data.buttonText ?? DEFAULT_WELCOME_POPUP_SETTINGS.buttonText,
          imageUrl: data.imageUrl ?? null,
          showEmailForm:
            data.showEmailForm ?? DEFAULT_WELCOME_POPUP_SETTINGS.showEmailForm,
          discountType:
            data.discountType ?? DEFAULT_WELCOME_POPUP_SETTINGS.discountType,
          discountValue:
            data.discountValue ?? DEFAULT_WELCOME_POPUP_SETTINGS.discountValue,
          codePrefix:
            data.codePrefix ?? DEFAULT_WELCOME_POPUP_SETTINGS.codePrefix,
          couponValidDays:
            data.couponValidDays ??
            DEFAULT_WELCOME_POPUP_SETTINGS.couponValidDays,
          emailSubject:
            data.emailSubject ?? DEFAULT_WELCOME_POPUP_SETTINGS.emailSubject,
          successTitle:
            data.successTitle ?? DEFAULT_WELCOME_POPUP_SETTINGS.successTitle,
          successMessage:
            data.successMessage ??
            DEFAULT_WELCOME_POPUP_SETTINGS.successMessage,
        },
      });
    } else {
      settings = await prisma.welcomePopupSettings.update({
        where: { id: settings.id },
        data: {
          ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
          ...(data.delayMs !== undefined && { delayMs: data.delayMs }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.emailPlaceholder !== undefined && {
            emailPlaceholder: data.emailPlaceholder,
          }),
          ...(data.consentText !== undefined && {
            consentText: data.consentText,
          }),
          ...(data.buttonText !== undefined && { buttonText: data.buttonText }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.showEmailForm !== undefined && {
            showEmailForm: data.showEmailForm,
          }),
          ...(data.discountType !== undefined && {
            discountType: data.discountType,
          }),
          ...(data.discountValue !== undefined && {
            discountValue: data.discountValue,
          }),
          ...(data.codePrefix !== undefined && { codePrefix: data.codePrefix }),
          ...(data.couponValidDays !== undefined && {
            couponValidDays: data.couponValidDays,
          }),
          ...(data.emailSubject !== undefined && {
            emailSubject: data.emailSubject,
          }),
          ...(data.successTitle !== undefined && {
            successTitle: data.successTitle,
          }),
          ...(data.successMessage !== undefined && {
            successMessage: data.successMessage,
          }),
        },
      });
    }

    await logAuditAction({
      action: "SETTINGS_UPDATE",
      adminId: user.id,
      adminEmail: user.email || "",
      targetType: "WelcomePopupSettings",
      targetId: settings.id,
      details: { oldValue: oldSettings, newValue: settings },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      id: settings.id,
      ...toPublicWelcomePopupSettings(settings),
    });
  } catch (error) {
    console.error("Error updating welcome popup settings:", error);
    return NextResponse.json(
      { error: "Ayarlar kaydedilemedi" },
      { status: 500 }
    );
  }
}
