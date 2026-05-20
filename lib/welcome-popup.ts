import type { DiscountType } from "@prisma/client";

export type WelcomePopupSettings = {
  isEnabled: boolean;
  delayMs: number;
  title: string;
  description: string;
  emailPlaceholder: string;
  consentText: string;
  buttonText: string;
  imageUrl: string | null;
  showEmailForm: boolean;
  discountType: DiscountType;
  discountValue: number;
  codePrefix: string;
  couponValidDays: number;
  emailSubject: string;
  successTitle: string;
  successMessage: string;
};

export const DEFAULT_WELCOME_POPUP_SETTINGS: WelcomePopupSettings = {
  isEnabled: false,
  delayMs: 3000,
  title: "İlk Siparişine Özel Sürpriz İndirimin Var! 🎁",
  description:
    "E-posta adresini bırak, sadece sana özel tanımlanacak indirimi keşfet.",
  emailPlaceholder: "E-posta adresiniz *",
  consentText:
    "Kullanım Koşullarını ve Gizlilik Politikasını okuduğumu ve kabul ettiğimi onaylıyorum.",
  buttonText: "Sürprizi Gör ✨",
  imageUrl: null,
  showEmailForm: true,
  discountType: "PERCENT",
  discountValue: 15,
  codePrefix: "WELCOME",
  couponValidDays: 30,
  emailSubject: "Dark Velvet'e Hoş Geldin! İlk Sipariş İndirimin İçeride 🎁",
  successTitle: "Harika!",
  successMessage:
    "İndirim kodunu {email} adresine gönderdik. Gelen kutunu (veya spam klasörünü) kontrol etmeyi unutma!",
};

export function toPublicWelcomePopupSettings(
  row: Partial<WelcomePopupSettings> | null | undefined
): WelcomePopupSettings {
  if (!row) return DEFAULT_WELCOME_POPUP_SETTINGS;
  return {
    isEnabled: row.isEnabled ?? DEFAULT_WELCOME_POPUP_SETTINGS.isEnabled,
    delayMs: row.delayMs ?? DEFAULT_WELCOME_POPUP_SETTINGS.delayMs,
    title: row.title ?? DEFAULT_WELCOME_POPUP_SETTINGS.title,
    description: row.description ?? DEFAULT_WELCOME_POPUP_SETTINGS.description,
    emailPlaceholder:
      row.emailPlaceholder ?? DEFAULT_WELCOME_POPUP_SETTINGS.emailPlaceholder,
    consentText: row.consentText ?? DEFAULT_WELCOME_POPUP_SETTINGS.consentText,
    buttonText: row.buttonText ?? DEFAULT_WELCOME_POPUP_SETTINGS.buttonText,
    imageUrl: row.imageUrl ?? null,
    showEmailForm:
      row.showEmailForm ?? DEFAULT_WELCOME_POPUP_SETTINGS.showEmailForm,
    discountType:
      row.discountType ?? DEFAULT_WELCOME_POPUP_SETTINGS.discountType,
    discountValue:
      row.discountValue ?? DEFAULT_WELCOME_POPUP_SETTINGS.discountValue,
    codePrefix: row.codePrefix ?? DEFAULT_WELCOME_POPUP_SETTINGS.codePrefix,
    couponValidDays:
      row.couponValidDays ?? DEFAULT_WELCOME_POPUP_SETTINGS.couponValidDays,
    emailSubject:
      row.emailSubject ?? DEFAULT_WELCOME_POPUP_SETTINGS.emailSubject,
    successTitle:
      row.successTitle ?? DEFAULT_WELCOME_POPUP_SETTINGS.successTitle,
    successMessage:
      row.successMessage ?? DEFAULT_WELCOME_POPUP_SETTINGS.successMessage,
  };
}

export function formatWelcomeDiscountLabel(
  discountType: DiscountType,
  discountValue: number
): string {
  if (discountType === "PERCENT") return `%${discountValue}`;
  return `${discountValue} TL`;
}

export function interpolateSuccessMessage(
  template: string,
  email: string
): string {
  return template.replace(/\{email\}/g, email);
}
