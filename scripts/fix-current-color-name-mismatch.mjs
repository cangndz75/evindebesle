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

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function titleCaseTR(value) {
  const lower = String(value || "").toLocaleLowerCase("tr-TR");
  if (!lower) return lower;
  return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
}

function buildId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function uniqueSlug(client, baseSlug) {
  let slug = baseSlug || `urun-${Date.now()}`;
  let i = 1;
  while (true) {
    const exists = await client.query('SELECT id FROM "Product" WHERE slug = $1 LIMIT 1', [slug]);
    if (exists.rowCount === 0) return slug;
    slug = `${baseSlug}-${i++}`;
  }
}

async function uniqueStockCode(client, baseStock) {
  let stockCode = baseStock || `STK-${Date.now()}`;
  let i = 1;
  while (true) {
    const exists = await client.query('SELECT id FROM "Product" WHERE "stockCode" = $1 LIMIT 1', [stockCode]);
    if (exists.rowCount === 0) return stockCode;
    stockCode = `${baseStock}-${i++}`;
  }
}

async function ensureTargetProduct(client, sourceProduct, colorName) {
  const sourceWords = String(sourceProduct.name || "").trim().split(/\s+/);
  const targetColorLabel = titleCaseTR(colorName);
  const targetName = sourceWords.length > 0
    ? [targetColorLabel, ...sourceWords.slice(1)].join(" ")
    : targetColorLabel;

  const existing = await client.query(
    `SELECT id, name FROM "Product"
     WHERE lower(name) = lower($1)
       AND coalesce("modelCode", '') = coalesce($2, '')
     LIMIT 1`,
    [targetName, sourceProduct.modelCode]
  );

  if (existing.rowCount > 0) {
    return { id: existing.rows[0].id, name: existing.rows[0].name, created: false };
  }

  const baseSlug = slugify(targetName);
  const slug = await uniqueSlug(client, baseSlug);

  const baseStockCode = `${sourceProduct.stockCode || sourceProduct.modelCode || sourceProduct.id}-${slugify(colorName)}`;
  const stockCode = await uniqueStockCode(client, baseStockCode);

  const inserted = await client.query(
    `INSERT INTO "Product" (
      id, name, slug, description, "detailText", price, "originalPrice", image, "primaryImage", "secondaryImage",
      "isActive", gender, "sizeType", "stockCode", barcode, "fabricType", brand, "categoryId", weight,
      "isTrackInventory", "allowBackorders", "shipmentType", "trendyolLink", "modelCode",
      "washingInstructionId", "deliveryInfoId", "sizeNoteId", "sizeGuideId", "modelInfoId", "createdAt", "updatedAt"
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,$19,
      $20,$21,$22,$23,$24,
      $25,$26,$27,$28,$29,NOW(),NOW()
    ) RETURNING id, name`,
    [
      buildId("fixp"),
      targetName,
      slug,
      sourceProduct.description,
      sourceProduct.detailText,
      sourceProduct.price,
      sourceProduct.originalPrice,
      sourceProduct.image,
      sourceProduct.primaryImage,
      sourceProduct.secondaryImage,
      sourceProduct.isActive,
      sourceProduct.gender,
      sourceProduct.sizeType,
      stockCode,
      null,
      sourceProduct.fabricType,
      sourceProduct.brand,
      sourceProduct.categoryId,
      sourceProduct.weight,
      sourceProduct.isTrackInventory,
      sourceProduct.allowBackorders,
      sourceProduct.shipmentType,
      sourceProduct.trendyolLink,
      sourceProduct.modelCode,
      sourceProduct.washingInstructionId,
      sourceProduct.deliveryInfoId,
      sourceProduct.sizeNoteId,
      sourceProduct.sizeGuideId,
      sourceProduct.modelInfoId,
    ]
  );

  return { id: inserted.rows[0].id, name: inserted.rows[0].name, created: true };
}

async function main() {
  const client = await pool.connect();
  const summary = {
    scannedProducts: 0,
    affectedProducts: 0,
    createdProducts: 0,
    movedColors: 0,
    movedVariants: 0,
  };

  try {
    const productsRes = await client.query(`
      SELECT p.*
      FROM "Product" p
      ORDER BY p.name
    `);

    summary.scannedProducts = productsRes.rowCount;

    for (const product of productsRes.rows) {
      const words = String(product.name || "").trim().split(/\s+/);
      const firstWord = normalize(words[0] || "");
      if (!COLOR_TOKENS.has(firstWord)) continue;

      const colorsRes = await client.query(
        `SELECT id, name FROM "ProductColor" WHERE "productId" = $1 ORDER BY name`,
        [product.id]
      );

      const mismatchedColors = colorsRes.rows.filter((c) => normalize(c.name) !== firstWord);
      if (mismatchedColors.length === 0) continue;

      summary.affectedProducts += 1;

      await client.query("BEGIN");
      try {
        for (const color of mismatchedColors) {
          const target = await ensureTargetProduct(client, product, color.name);
          if (target.created) summary.createdProducts += 1;

          const variantRows = await client.query(
            `SELECT id, "sizeId" FROM "ProductVariant" WHERE "productId" = $1 AND "colorId" = $2`,
            [product.id, color.id]
          );

          const sizeIdMap = new Map();

          for (const vr of variantRows.rows) {
            if (!vr.sizeId) continue;
            if (sizeIdMap.has(vr.sizeId)) continue;

            const sourceSizeRes = await client.query(
              `SELECT id, name, stock FROM "ProductSize" WHERE id = $1 LIMIT 1`,
              [vr.sizeId]
            );
            if (sourceSizeRes.rowCount === 0) continue;
            const sourceSize = sourceSizeRes.rows[0];

            const targetSizeRes = await client.query(
              `SELECT id FROM "ProductSize" WHERE "productId" = $1 AND lower(name) = lower($2) LIMIT 1`,
              [target.id, sourceSize.name]
            );

            let targetSizeId;
            if (targetSizeRes.rowCount > 0) {
              targetSizeId = targetSizeRes.rows[0].id;
            } else {
              const insertedSize = await client.query(
                `INSERT INTO "ProductSize" (id, "productId", name, stock, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
                [buildId("fixs"), target.id, sourceSize.name, sourceSize.stock]
              );
              targetSizeId = insertedSize.rows[0].id;
            }

            sizeIdMap.set(vr.sizeId, targetSizeId);
          }

          for (const vr of variantRows.rows) {
            await client.query(
              `UPDATE "ProductVariant" SET "productId" = $1, "sizeId" = $2 WHERE id = $3`,
              [target.id, sizeIdMap.get(vr.sizeId) || vr.sizeId, vr.id]
            );
            summary.movedVariants += 1;
          }

          await client.query(
            `UPDATE "ProductColor" SET "productId" = $1 WHERE id = $2`,
            [target.id, color.id]
          );
          summary.movedColors += 1;

          const targetImageCheck = await client.query(
            `SELECT "primaryImage", image FROM "Product" WHERE id = $1 LIMIT 1`,
            [target.id]
          );
          const colorImageRes = await client.query(
            `SELECT images FROM "ProductColor" WHERE id = $1 LIMIT 1`,
            [color.id]
          );

          const targetProduct = targetImageCheck.rows[0];
          const imagesRaw = colorImageRes.rows[0]?.images;
          let firstColorImage = null;
          if (imagesRaw) {
            try {
              const parsed = JSON.parse(imagesRaw);
              if (Array.isArray(parsed) && parsed.length > 0) firstColorImage = parsed[0];
            } catch {
              firstColorImage = null;
            }
          }

          if (!targetProduct?.primaryImage && firstColorImage) {
            await client.query(
              `UPDATE "Product" SET "primaryImage" = $1, image = coalesce(image, $1) WHERE id = $2`,
              [firstColorImage, target.id]
            );
          }
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
