export const WELCOME_POPUP_STORAGE_KEY = "welcomePopupSeen";
export const COOKIE_CONSENT_STORAGE_KEY = "cookieConsent";
export const WELCOME_POPUP_CLOSED_EVENT = "welcome-popup-closed";

/** Hoş geldin popup kapanınca çerez bandının gösterilmesi için */
export function notifyWelcomePopupClosed() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WELCOME_POPUP_CLOSED_EVENT));
  }
}
