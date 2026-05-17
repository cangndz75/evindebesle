/**
 * Sipariş satırı e-postası / OrderItem.image için ortak görsel çözümü.
 * Göreli URL'leri mutlak yapar (e-posta istemcileri için).
 */

export type OrderLineImageProductInput = {
  primaryImage?: string | null;
  image?: string | null;
  colors?: Array<{
    id: string;
    images?: string | null;
    productImages?: Array<{ url: string }>;
  }>;
};

function trimUrl(raw: string | null | undefined): string | null {
  const t = raw != null ? String(raw).trim() : "";
  return t.length > 0 ? t : null;
}

export function toAbsolutePublicImageUrl(raw: string | null | undefined, baseUrl: string): string | null {
  const u = trimUrl(raw);
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  const base = baseUrl.replace(/\/$/, "");
  if (u.startsWith("/")) return `${base}${u}`;
  return `${base}/${u}`;
}

function firstFromColorImagesJson(images: string | null | undefined): string | null {
  const s = trimUrl(images);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  try {
    const parsed = JSON.parse(s) as unknown;
    if (Array.isArray(parsed) && parsed[0]) return trimUrl(String(parsed[0]));
  } catch {
    /* ignore */
  }
  return null;
}

/** Renk / ürün alanlarından ham görsel URL (göreli veya mutlak). */
export function pickOrderLineImageRaw(product: OrderLineImageProductInput, colorId: string | null): string | null {
  if (colorId && product.colors?.length) {
    const col = product.colors.find((c) => c.id === colorId);
    if (col) {
      const fromPi = trimUrl(col.productImages?.[0]?.url);
      if (fromPi) return fromPi;
      const fromJson = firstFromColorImagesJson(col.images ?? null);
      if (fromJson) return fromJson;
    }
  }
  return trimUrl(product.primaryImage) || trimUrl(product.image);
}

export function resolveOrderLineImageAbsoluteUrl(
  baseUrl: string,
  opts: {
    persistedImage?: string | null;
    product?: OrderLineImageProductInput | null;
    colorId?: string | null;
    /** Sipariş anındaki renk satırı (ürün silinse bile görsel için) */
    lineColor?: {
      images?: string | null;
      productImages?: Array<{ url: string }>;
    } | null;
  }
): string | null {
  const persisted = toAbsolutePublicImageUrl(opts.persistedImage, baseUrl);
  if (persisted) return persisted;

  const lc = opts.lineColor;
  if (lc) {
    const fromPi = trimUrl(lc.productImages?.[0]?.url);
    const fromJson = fromPi || firstFromColorImagesJson(lc.images ?? null);
    const abs = toAbsolutePublicImageUrl(fromJson, baseUrl);
    if (abs) return abs;
  }

  if (!opts.product) return null;
  const raw = pickOrderLineImageRaw(opts.product, opts.colorId ?? null);
  return toAbsolutePublicImageUrl(raw, baseUrl);
}
