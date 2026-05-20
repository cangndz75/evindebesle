import { randomBytes } from "crypto";
import type { DiscountType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resend, resendFromAddress } from "@/lib/resend";
import { generateWelcomeDiscountEmailHtml } from "@/lib/email/templates/welcome-discount-template";
import { syncWelcomeCouponForUser } from "@/lib/coupons/sync-welcome-coupon";
import {
  DEFAULT_WELCOME_POPUP_SETTINGS,
  formatWelcomeDiscountLabel,
  toPublicWelcomePopupSettings,
} from "@/lib/welcome-popup";

export class WelcomePopupClaimError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function generateUniqueCouponCode(prefix: string): Promise<string> {
  const cleanPrefix = prefix.replace(/[^A-Z0-9]/gi, "").toUpperCase() || "WELCOME";

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `${cleanPrefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (!existing) return code;
  }

  throw new WelcomePopupClaimError("Kupon kodu üretilemedi.", 500);
}

export async function claimWelcomePopupDiscount(
  email: string,
  options?: { userId?: string }
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new WelcomePopupClaimError("Geçerli bir e-posta adresi giriniz.", 400);
  }

  const settingsRow = await prisma.welcomePopupSettings.findFirst();
  const settings = toPublicWelcomePopupSettings(settingsRow);

  if (!settings.isEnabled) {
    throw new WelcomePopupClaimError("Kampanya şu an aktif değil.", 403);
  }

  const existing = await prisma.subscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing?.welcomeClaimedAt) {
    throw new WelcomePopupClaimError(
      "Bu e-posta adresi daha önce kampanyadan faydalanmış.",
      409
    );
  }

  const discountType = settings.discountType as DiscountType;
  const discountValue = Math.max(1, settings.discountValue);
  const validDays = Math.max(1, Math.min(settings.couponValidDays, 365));
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validDays);

  const discountCode = await generateUniqueCouponCode(settings.codePrefix);
  const discountLabel = formatWelcomeDiscountLabel(discountType, discountValue);

  const { coupon } = await prisma.$transaction(async (tx) => {
    const coupon = await tx.coupon.create({
      data: {
        code: discountCode,
        description: `Hoş geldin popup — ${normalizedEmail}`,
        discountType,
        value: discountValue,
        maxUsage: 1,
        expiresAt,
        isActive: true,
      },
    });

    await tx.subscriber.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        isActive: true,
        welcomeClaimedAt: new Date(),
        welcomeCouponId: coupon.id,
      },
      update: {
        isActive: true,
        welcomeClaimedAt: new Date(),
        welcomeCouponId: coupon.id,
      },
    });

    return { coupon };
  });

  const shopUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.FRONTEND_BASE_URL ||
    "https://darkvelvet.com";

  const { error: emailError } = await resend.emails.send({
    from: resendFromAddress(),
    to: [normalizedEmail],
    subject: settings.emailSubject,
    html: generateWelcomeDiscountEmailHtml({
      discountLabel,
      discountCode: coupon.code,
      shopUrl,
      validDays,
    }),
  });

  if (emailError) {
    console.error("[WELCOME_POPUP_EMAIL_ERROR]", emailError);
    await prisma.$transaction([
      prisma.subscriber.update({
        where: { email: normalizedEmail },
        data: { welcomeClaimedAt: null, welcomeCouponId: null },
      }),
      prisma.coupon.delete({ where: { id: coupon.id } }),
    ]);
    throw new WelcomePopupClaimError(
      "İndirim kodu oluşturuldu ancak e-posta gönderilemedi. Lütfen tekrar deneyin.",
      500
    );
  }

  if (options?.userId) {
    await syncWelcomeCouponForUser(options.userId, normalizedEmail);
  }

  return {
    message: "İndirim kodu e-posta adresinize gönderildi.",
    email: normalizedEmail,
  };
}

export async function getWelcomePopupSettingsForClaim() {
  const row = await prisma.welcomePopupSettings.findFirst();
  return toPublicWelcomePopupSettings(row ?? DEFAULT_WELCOME_POPUP_SETTINGS);
}
