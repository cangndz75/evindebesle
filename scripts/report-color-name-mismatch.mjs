import "dotenv/config";
import pg from "pg";
import { normalizeDatabaseUrlForPg } from "../lib/normalize-database-url.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: normalizeDatabaseUrlForPg(process.env.DATABASE_URL),
});

const COLOR_TOKENS = new Set([
  "siyah", "black", "ekru", "ecru", "beyaz", "white", "krem", "ivory", "gri", "gray", "grey",
  "antrasit", "lacivert", "navy", "mavi", "blue", "bej", "beige", "tas", "vizon", "kum", "nude",
  "kahve", "camel", "taba", "brown", "pembe", "pink", "gul", "kirmizi", "red", "bordo", "yesil", "green",
  "haki", "khaki", "sari", "yellow", "hardal", "mor", "purple", "lila", "turuncu", "orange",
]);

function normalize(value) {
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

try {
  const products = await pool.query('SELECT id, name FROM "Product" ORDER BY name');
  const mismatches = [];

  for (const p of products.rows) {
    const first = normalize(String(p.name || "").split(/\s+/)[0] || "");
    if (!COLOR_TOKENS.has(first)) continue;

    const colors = await pool.query('SELECT name FROM "ProductColor" WHERE "productId" = $1', [p.id]);
    const bad = colors.rows
      .map((c) => normalize(c.name))
      .filter((n) => n && n !== first);

    if (bad.length > 0) {
      mismatches.push({ productId: p.id, productName: p.name, mismatchedColors: bad });
    }
  }

  console.log(JSON.stringify({ totalProducts: products.rowCount, mismatchCount: mismatches.length, mismatches }, null, 2));
} finally {
  await pool.end();
}
