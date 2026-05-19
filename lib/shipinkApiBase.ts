/**
 * Shipink REST kök URL (sonda / yok).
 * Production: https://api.shipink.io
 * Development: https://api.dev.shipink.io
 *
 * `SHIPINK_API_URL` yalnızca panelde verilen resmi host ile set edilmeli.
 * api.shipink.com geçersizdir (DNS yok) — fetch failed / ENOTFOUND üretir.
 */
const DEFAULT_PROD = "https://api.shipink.io";
const DEFAULT_DEV = "https://api.dev.shipink.io";

/** Bilinen yanlış panel / dokümantasyon host'ları */
const INVALID_HOST_PATTERNS = [/api\.shipink\.com$/i, /\.shipink\.com$/i];

function defaultBaseUrl(): string {
  return process.env.NODE_ENV === "production" ? DEFAULT_PROD : DEFAULT_DEV;
}

function isInvalidShipinkHost(hostname: string): boolean {
  return INVALID_HOST_PATTERNS.some((re) => re.test(hostname));
}

let warnedInvalidShipinkUrl = false;

export function getShipinkApiBaseUrl(): string {
  const explicit = (process.env.SHIPINK_API_URL || "").trim().replace(/\/$/, "");
  if (!explicit) {
    return defaultBaseUrl();
  }

  try {
    const { hostname } = new URL(explicit);
    if (isInvalidShipinkHost(hostname)) {
      if (!warnedInvalidShipinkUrl) {
        warnedInvalidShipinkUrl = true;
        console.warn(
          `[Shipink] SHIPINK_API_URL geçersiz host (${hostname}). ` +
            `Vercel/.env içinde ${DEFAULT_PROD} yapın veya değişkeni kaldırın.`,
        );
      }
      return defaultBaseUrl();
    }
    return explicit;
  } catch {
    if (!warnedInvalidShipinkUrl) {
      warnedInvalidShipinkUrl = true;
      console.warn(`[Shipink] SHIPINK_API_URL geçersiz URL: ${explicit}. Varsayılan kullanılıyor.`);
    }
    return defaultBaseUrl();
  }
}

/** fetch failed / ENOTFOUND gibi ağ hatalarını log için zenginleştirir */
export function formatShipinkFetchError(err: unknown, context?: string): string {
  if (!(err instanceof Error)) {
    return context ? `${context}: ${String(err)}` : String(err);
  }

  const cause = err.cause as NodeJS.ErrnoException | undefined;
  const parts: string[] = [];
  if (context) parts.push(context);
  parts.push(err.message);
  if (cause?.code) parts.push(`code=${cause.code}`);
  if (cause?.message && cause.message !== err.message) parts.push(cause.message);

  return parts.join(" | ");
}
