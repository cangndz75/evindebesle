/**
 * Shipink REST kök URL (sonda / yok).
 * `SHIPINK_API_URL` tanımlıysa kullanılır (örn. https://api.shipink.com/v1).
 */
export function getShipinkApiBaseUrl(): string {
  const explicit = (process.env.SHIPINK_API_URL || "").trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  return process.env.NODE_ENV === "production"
    ? "https://api.shipink.io"
    : "https://api.dev.shipink.io";
}
