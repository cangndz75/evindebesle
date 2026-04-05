const COLOR_NAME_TO_HEX: Record<string, string> = {
  siyah: "#000000",
  black: "#000000",
  ekru: "#e8e1cf",
  ecru: "#e8e1cf",
  krem: "#efe7d8",
  ivory: "#f4f0e5",
  beyaz: "#f6f6f6",
  white: "#f6f6f6",
  gri: "#a8a8a8",
  gray: "#a8a8a8",
  grey: "#a8a8a8",
  antrasit: "#4a4f56",
  anthracite: "#4a4f56",
  lacivert: "#1f2d4f",
  navy: "#1f2d4f",
  mavi: "#3f5f9f",
  blue: "#3f5f9f",
  bej: "#cdbca6",
  beige: "#cdbca6",
  tas: "#c7b49e",
  vizon: "#c8b5a1",
  kum: "#c8b5a1",
  nude: "#c8b5a1",
  kahve: "#8a6642",
  camel: "#8a6642",
  taba: "#8a6642",
  brown: "#8a6642",
  pembe: "#dba9af",
  pink: "#dba9af",
  gul: "#dba9af",
  kirmizi: "#8d2f3c",
  red: "#8d2f3c",
  bordo: "#8d2f3c",
  yesil: "#6d7b52",
  green: "#6d7b52",
  haki: "#6d7b52",
  khaki: "#6d7b52",
  sari: "#b7923a",
  yellow: "#b7923a",
  hardal: "#b7923a",
  mor: "#816d9b",
  purple: "#816d9b",
  lila: "#816d9b",
  lavanta: "#816d9b",
  turuncu: "#b76846",
  orange: "#b76846",
};

function normalizeColorToken(value?: string | null): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCssColorValue(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
    || /^rgb\(/i.test(value)
    || /^rgba\(/i.test(value)
    || /^hsl\(/i.test(value)
    || /^hsla\(/i.test(value);
}

export function resolveSwatchHex(
  input: { name?: string | null; hexCode?: string | null; value?: string | null },
  fallback = "#d1d5db"
): string {
  const rawHex = String(input.hexCode || "").trim();
  if (rawHex && isCssColorValue(rawHex)) {
    return rawHex;
  }

  const rawValue = String(input.value || "").trim();
  if (rawValue && isCssColorValue(rawValue)) {
    return rawValue;
  }

  const normalizedName = normalizeColorToken(input.name);
  if (normalizedName) {
    for (const [token, hex] of Object.entries(COLOR_NAME_TO_HEX)) {
      if (normalizedName.includes(token)) {
        return hex;
      }
    }
  }

  const normalizedValue = normalizeColorToken(rawValue);
  if (normalizedValue) {
    for (const [token, hex] of Object.entries(COLOR_NAME_TO_HEX)) {
      if (normalizedValue.includes(token)) {
        return hex;
      }
    }
  }

  return fallback;
}
