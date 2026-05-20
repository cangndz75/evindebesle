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
  };
}
