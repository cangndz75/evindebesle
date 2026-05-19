import { prisma } from "@/lib/db";

const PROVIDER = "shipink";

const SHIPINK_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.shipink.io"
    : "https://api.dev.shipink.io";

const SHIPINK_EMAIL = (process.env.SHIPINK_EMAIL || "").trim();
const SHIPINK_PASSWORD = (process.env.SHIPINK_PASSWORD || "").trim();

const ACCESS_TOKEN_TTL_SEC = 1800;
const REFRESH_TOKEN_TTL_SEC = 2592000;
const ACCESS_TOKEN_SAFETY_MARGIN_MS = 5 * 60 * 1000;

type TokenRow = {
  accessToken: string;
  refreshToken: string | null;
  accessExpiresAt: Date;
  refreshExpiresAt: Date | null;
};

async function getStoredToken(): Promise<TokenRow | null> {
  return prisma.integrationToken.findUnique({ where: { provider: PROVIDER } });
}

async function upsertToken(data: {
  accessToken: string;
  refreshToken?: string | null;
  accessExpiresAt: Date;
  refreshExpiresAt?: Date | null;
}): Promise<void> {
  await prisma.integrationToken.upsert({
    where: { provider: PROVIDER },
    create: { provider: PROVIDER, ...data },
    update: data,
  });
}

function isExpired(expiresAt: Date, safetyMs = 0): boolean {
  return Date.now() >= expiresAt.getTime() - safetyMs;
}

async function loginWithCredentials(): Promise<string> {
  if (!SHIPINK_EMAIL || !SHIPINK_PASSWORD) {
    throw new Error("[ShipinkAuth] SHIPINK_EMAIL veya SHIPINK_PASSWORD tanımlı değil.");
  }

  const res = await fetch(`${SHIPINK_API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: SHIPINK_EMAIL, password: SHIPINK_PASSWORD }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`[ShipinkAuth] Login hatası ${res.status}: ${err.error_description || JSON.stringify(err)}`);
  }

  const data = await res.json();
  const now = new Date();

  const expiresIn = data.expires_in ?? ACCESS_TOKEN_TTL_SEC;
  const refreshExpiresIn = data.refresh_expires_in ?? REFRESH_TOKEN_TTL_SEC;

  await upsertToken({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    accessExpiresAt: new Date(now.getTime() + expiresIn * 1000),
    refreshExpiresAt: data.refresh_token
      ? new Date(now.getTime() + refreshExpiresIn * 1000)
      : null,
  });

  return data.access_token;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${SHIPINK_API_URL}/token/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    console.warn("[ShipinkAuth] Refresh başarısız, yeniden login yapılacak.");
    return loginWithCredentials();
  }

  const data = await res.json();
  const now = new Date();

  const expiresIn = data.expires_in ?? ACCESS_TOKEN_TTL_SEC;
  const refreshExpiresIn = data.refresh_expires_in ?? REFRESH_TOKEN_TTL_SEC;

  await upsertToken({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    accessExpiresAt: new Date(now.getTime() + expiresIn * 1000),
    refreshExpiresAt: data.refresh_token
      ? new Date(now.getTime() + refreshExpiresIn * 1000)
      : null,
  });

  return data.access_token;
}

/**
 * Geçerli bir Shipink access_token döndürür.
 * Öncelik: DB'deki token → refresh → tam login
 */
export async function getShipinkAccessToken(): Promise<string> {
  const stored = await getStoredToken();

  if (stored) {
    if (!isExpired(stored.accessExpiresAt, ACCESS_TOKEN_SAFETY_MARGIN_MS)) {
      return stored.accessToken;
    }

    if (
      stored.refreshToken &&
      stored.refreshExpiresAt &&
      !isExpired(stored.refreshExpiresAt)
    ) {
      return refreshAccessToken(stored.refreshToken);
    }
  }

  return loginWithCredentials();
}
