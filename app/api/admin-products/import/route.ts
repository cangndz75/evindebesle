import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { generateVariantCode, generateProductSlug } from "@/lib/slug";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

function toExcelBuffer(data: ArrayBuffer | Buffer): Buffer<ArrayBuffer> {
  return data instanceof ArrayBuffer
    ? Buffer.from(new Uint8Array(data))
    : Buffer.from(data);
}

const COL = {
  PARTNER_ID:     "Partner ID",
  BARCODE:        "Barkod",
  COMMISSION:     "Komisyon Oranı",
  MODEL_CODE:     "Model Kodu",
  COLOR:          "Ürün Rengi",
  SIZE:           "Beden",
  DIMENSION:      "Boyut/Ebat",
  GENDER:         "Cinsiyet",
  BRAND:          "Marka",
  CATEGORY:       "Kategori İsmi",
  SUPPLIER_CODE:  "Tedarikçi Stok Kodu",
  NAME:           "Ürün Adı",
  DESCRIPTION:    "Ürün Açıklaması",
  MARKET_PRICE:   "Piyasa Satış Fiyatı (KDV Dahil)",
  SALE_PRICE:     "Trendyol'da Satılacak Fiyat",
  BUYBOX_PRICE:   "BuyBox Fiyatı",
  STOCK:          "Ürün Stok Adedi",
  VAT_RATE:       "KDV Oranı",
  OTV_RATE:       "ÖTV Oranı",
  SHIPMENT_TYPE:  "Sevkiyat Tipi",
  IMAGE1:         "Görsel 1",
  IMAGE2:         "Görsel 2",
  IMAGE3:         "Görsel 3",
  IMAGE4:         "Görsel 4",
  IMAGE5:         "Görsel 5",
  IMAGE6:         "Görsel 6",
  IMAGE7:         "Görsel 7",
  IMAGE8:         "Görsel 8",
  TRENDYOL_LINK:  "Trendyol Linki",
};

function str(row: any, key: string): string {
  const v = row[key];
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function num(row: any, key: string): number {
  const v = row[key];
  if (v === undefined || v === null || v === "") return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function cleanUrl(url: string | undefined): string | null {
  if (!url) return null;
  const t = String(url).trim();
  return t.startsWith("http") ? t : null;
}

function extractUrlsFromCell(value: string | undefined): string[] {
  if (!value) return [];
  const text = String(value).trim();
  if (!text) return [];

  // Handles both delimited cells and concatenated URL blobs from marketplace exports.
  const regex = /https?:\/\/[\w\-._~:/?#\[\]@!$&'()*+,;=%]+/gi;
  const matches = text.match(regex) || [];

  const urls = matches
    .map((m) => m.trim())
    .filter((m) => m.startsWith("http"))
    .map((m) => {
      const nextHttpIndex = m.indexOf("http", 8);
      return nextHttpIndex > -1 ? m.slice(0, nextHttpIndex) : m;
    })
    .map((m) => m.replace(/[\s,;]+$/g, ""));

  return Array.from(new Set(urls));
}

function parseColorImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return extractUrlsFromCell(images);
  }
}

function normalizeGender(val: string): "FEMALE" | "MALE" | "UNISEX" | undefined {
  const v = val.toLowerCase();
  if (v.includes("kadın") || v.includes("kız") || v.includes("female")) return "FEMALE";
  if (v.includes("erkek") || v.includes("male")) return "MALE";
  if (v.includes("unisex")) return "UNISEX";
  return undefined;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const COLOR_TOKENS = new Set([
  "siyah", "black", "ekru", "ecru", "beyaz", "white", "krem", "ivory", "gri", "gray", "grey",
  "antrasit", "lacivert", "navy", "mavi", "blue", "bej", "beige", "tas", "vizon", "kum", "nude",
  "kahve", "camel", "taba", "brown", "pembe", "pink", "gul", "kirmizi", "red", "bordo", "yesil", "green",
  "haki", "khaki", "sari", "yellow", "hardal", "mor", "purple", "lila", "turuncu", "orange",
]);

function normalizeColorToken(value: string): string {
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

async function validateImportedProductsColorConsistency(productIds: string[]) {
  if (productIds.length === 0) {
    return { checkedCount: 0, mismatchCount: 0, mismatches: [] as Array<{ productId: string; productName: string; mismatchedColors: string[] }> };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      colors: {
        select: {
          name: true,
        },
      },
    },
  });

  const mismatches: Array<{ productId: string; productName: string; mismatchedColors: string[] }> = [];

  for (const product of products) {
    const firstWord = normalizeColorToken(String(product.name || "").split(/\s+/)[0] || "");
    if (!COLOR_TOKENS.has(firstWord)) continue;

    const badColors = product.colors
      .map((c: { name: string }) => normalizeColorToken(c.name))
      .filter((colorName: string) => colorName && colorName !== firstWord);

    if (badColors.length > 0) {
      mismatches.push({
        productId: product.id,
        productName: product.name,
        mismatchedColors: Array.from(new Set(badColors)),
      });
    }
  }

  return {
    checkedCount: products.length,
    mismatchCount: mismatches.length,
    mismatches,
  };
}

function normalizeForKey(text: string): string {
  return String(text || "")
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

function stripLeadingColorFromName(name: string, color?: string): string {
  const normalizedName = normalizeForKey(name);
  const normalizedColor = normalizeForKey(color || "");
  if (normalizedColor && normalizedName.startsWith(`${normalizedColor} `)) {
    return normalizedName.slice(normalizedColor.length + 1).trim();
  }

  const knownColors = [
    "siyah", "black", "ekru", "ecru", "beyaz", "white", "krem", "ivory",
    "gri", "gray", "grey", "antrasit", "lacivert", "navy", "mavi", "blue",
    "bej", "beige", "tas", "vizon", "kum", "nude", "kahve", "camel", "taba",
    "brown", "pembe", "pink", "gul", "kirmizi", "red", "bordo", "yesil", "green",
    "haki", "khaki", "sari", "yellow", "hardal", "mor", "purple", "lila", "turuncu", "orange",
  ];

  for (const token of knownColors) {
    if (normalizedName.startsWith(`${token} `)) {
      return normalizedName.slice(token.length + 1).trim();
    }
  }

  return normalizedName;
}

function buildProductIdentityKey(row: ExcelRow): string {
  const baseName = stripLeadingColorFromName(row.name, row.color) || normalizeForKey(row.name);
  const modelKey = normalizeForKey(row.modelCode || "");
  const brandKey = normalizeForKey(row.brand || "");
  const categoryKey = normalizeForKey(row.category || "");

  if (modelKey) {
    return `${modelKey}::${baseName}`;
  }

  return [baseName, brandKey, categoryKey].filter(Boolean).join("|");
}

interface ExcelRow {
  barcode: string;
  modelCode: string;
  color: string;
  size: string;
  dimension: string;
  gender: string;
  stock: number;
  commissionRate: number;
  vatRate: number;
  otvRate: number;
  images: string[];
  brand: string;
  category: string;
  supplierCode: string;
  name: string;
  description: string;
  marketPrice: number;
  salePrice: number;
  buyBoxPrice: number;
  shipmentType: string;
  trendyolLink: string;
}

function normalizeCellValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.map((v) => normalizeCellValue(v)).join(" ").trim();
    const richText = (value as any).richText;
    if (Array.isArray(richText)) return richText.map((r: any) => r?.text || "").join("").trim();
    const text = (value as any).text;
    if (typeof text === "string") return text.trim();
    const result = (value as any).result;
    if (result !== undefined && result !== null) return String(result).trim();
  }
  return String(value).trim();
}

async function readExcelRowsFromBuffer(buffer: Buffer): Promise<any[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(Readable.from([toExcelBuffer(buffer)]));
  const worksheet = workbook.worksheets[0];

  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];

  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = normalizeCellValue(cell.value);
  });

  const rows: any[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const out: Record<string, string> = {};
    let hasAnyValue = false;

    for (let colNumber = 1; colNumber < headers.length; colNumber++) {
      const header = headers[colNumber];
      if (!header) continue;

      const cellValue = normalizeCellValue(row.getCell(colNumber).value);
      if (cellValue !== "") hasAnyValue = true;
      out[header] = cellValue;
    }

    if (hasAnyValue) rows.push(out);
  }

  return rows;
}

function parseRows(data: any[]): ExcelRow[] {
  return data.map((row) => ({
    barcode:        str(row, COL.BARCODE),
    modelCode:      str(row, COL.MODEL_CODE),
    color:          str(row, COL.COLOR),
    size:           str(row, COL.SIZE),
    dimension:      str(row, COL.DIMENSION),
    gender:         str(row, COL.GENDER),
    stock:          Math.round(num(row, COL.STOCK)),
    commissionRate: num(row, COL.COMMISSION),
    vatRate:        num(row, COL.VAT_RATE),
    otvRate:        num(row, COL.OTV_RATE),
    images: [
      COL.IMAGE1, COL.IMAGE2, COL.IMAGE3, COL.IMAGE4,
      COL.IMAGE5, COL.IMAGE6, COL.IMAGE7, COL.IMAGE8,
    ]
      .flatMap((k) => extractUrlsFromCell(str(row, k)))
      .filter((u): u is string => Boolean(cleanUrl(u))),
    brand:          str(row, COL.BRAND),
    category:       str(row, COL.CATEGORY),
    supplierCode:   str(row, COL.SUPPLIER_CODE),
    name:           str(row, COL.NAME),
    description:    str(row, COL.DESCRIPTION),
    marketPrice:    num(row, COL.MARKET_PRICE),
    salePrice:      num(row, COL.SALE_PRICE),
    buyBoxPrice:    num(row, COL.BUYBOX_PRICE),
    shipmentType:   str(row, COL.SHIPMENT_TYPE),
    trendyolLink:   str(row, COL.TRENDYOL_LINK),
  }));
}

function groupRows(rows: ExcelRow[]): Map<string, ExcelRow[]> {
  const map = new Map<string, ExcelRow[]>();
  for (const row of rows) {
    const key = buildProductIdentityKey(row)
      || row.barcode
      || [row.name, row.brand, row.category].filter(Boolean).join("|");
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });

    const buffer = toExcelBuffer(await file.arrayBuffer());
    const rawData = await readExcelRowsFromBuffer(buffer);

    if (!rawData.length) return NextResponse.json({ error: "Excel dosyası boş" }, { status: 400 });

    const rows = parseRows(rawData);
    const groups = groupRows(rows);

    const catCache = new Map<string, string>();
    let createdCategories = 0;

    async function getCategoryId(name: string): Promise<string | null> {
      if (!name) return null;
      const key = name.toLowerCase().trim();
      if (catCache.has(key)) return catCache.get(key)!;
      let cat = await prisma.category.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true },
      });
      if (!cat) {
        const slug = slugify(name);
        const existingSlug = await prisma.category.findUnique({ where: { slug } });
        cat = await prisma.category.create({
          data: {
            name: name.trim(),
            slug: existingSlug ? `${slug}-${Date.now()}` : slug,
            isActive: true,
          },
          select: { id: true },
        });
        createdCategories++;
      }
      catCache.set(key, cat.id);
      return cat.id;
    }

    let createdProducts = 0;
    let updatedProducts = 0;
    let createdVariants = 0;
    let updatedVariants = 0;
    const errors: { group: string; error: string }[] = [];
    const touchedProductIds = new Set<string>();

    for (const [groupKey, groupRows] of groups) {
      try {
        const first = groupRows[0];
        const productName = first.name || groupKey;
        if (!productName) continue;

        const salePrice = first.salePrice || first.marketPrice || 0;
        const categoryId = await getCategoryId(first.category);
        const gender = normalizeGender(first.gender);

        const identityKey = buildProductIdentityKey(first) || groupKey;
        const stockCode = identityKey;
        const legacyStockCode = first.modelCode || first.supplierCode || first.barcode || groupKey;

        let product = await prisma.product.findFirst({
          where: {
            OR: [
              { stockCode },
              { stockCode: legacyStockCode },
            ],
          },
          select: { id: true, name: true, stockCode: true },
        });

        if (product) {
          const importedBaseName = stripLeadingColorFromName(first.name, first.color);
          const existingBaseName = stripLeadingColorFromName(product.name, "");
          if (importedBaseName && existingBaseName && importedBaseName !== existingBaseName) {
            product = null;
          }
        }

        if (!product) {
          let slug = generateProductSlug(productName, first.category || null, first.color || null);
          const existingSlug = await prisma.product.findFirst({ where: { slug } });
          if (existingSlug) slug = `${slug}-${Date.now()}`;

          product = await prisma.product.create({
            data: {
              name: productName,
              slug,
              stockCode,
              modelCode: first.modelCode || null,
              description: first.description || null,
              price: salePrice,
              originalPrice: first.marketPrice || null,
              gender,
              brand: first.brand || null,
              categoryId,
              isActive: true,
              shipmentType: first.shipmentType || null,
              trendyolLink: first.trendyolLink || null,
              primaryImage: first.images[0] || null,
              secondaryImage: first.images[1] || null,
              image: first.images[0] || null,
            },
            select: { id: true },
          });
          createdProducts++;
        } else {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              stockCode,
              name: productName,
              modelCode: first.modelCode || undefined,
              description: first.description || undefined,
              price: salePrice || undefined,
              originalPrice: first.marketPrice || undefined,
              gender: gender || undefined,
              brand: first.brand || undefined,
              categoryId: categoryId || undefined,
              shipmentType: first.shipmentType || undefined,
              trendyolLink: first.trendyolLink || undefined,
              primaryImage: first.images[0] || undefined,
              image: first.images[0] || undefined,
            },
          });
          updatedProducts++;
        }

        const productId = product.id;
        touchedProductIds.add(productId);

        for (let i = 0; i < first.images.length; i++) {
          const url = first.images[i];
          const exists = await prisma.productImage.findFirst({
            where: { productId, url },
            select: { id: true },
          });
          if (!exists) {
            await prisma.productImage.create({
              data: {
                productId,
                url,
                order: i,
                isPrimary: i === 0,
                isSecondary: i > 0,
                alt: productName,
              },
            });
          }
        }

        const colorMap = new Map<string, string>();
        const existingColors = await prisma.productColor.findMany({
          where: { productId },
          select: { id: true, name: true, images: true },
        });
        const colorImagesMap = new Map<string, string[]>();
        for (const c of existingColors) {
          const ck = c.name.trim().toLowerCase();
          colorMap.set(ck, c.id);
          colorImagesMap.set(ck, parseColorImages(c.images));
        }

        for (const row of groupRows) {
          if (!row.color) continue;
          const ck = row.color.trim().toLowerCase();
          const current = colorImagesMap.get(ck) || [];
          const merged = Array.from(new Set([...current, ...(row.images || [])]));
          colorImagesMap.set(ck, merged);
        }

        const sizeMap = new Map<string, string>();
        const existingSizes = await prisma.productSize.findMany({
          where: { productId },
          select: { id: true, name: true },
        });
        for (const s of existingSizes) sizeMap.set(s.name.trim().toLowerCase(), s.id);

        for (const row of groupRows) {
          try {
            let colorId: string | null = null;
            if (row.color) {
              const ck = row.color.trim().toLowerCase();
              if (!colorMap.has(ck)) {
                const newColor = await prisma.productColor.create({
                  data: {
                    productId,
                    name: row.color.trim(),
                    images: JSON.stringify(colorImagesMap.get(ck) || []),
                  },
                  select: { id: true },
                });
                colorMap.set(ck, newColor.id);
              } else {
                const imagesForColor = colorImagesMap.get(ck) || [];
                if (imagesForColor.length > 0) {
                  await prisma.productColor.update({
                    where: { id: colorMap.get(ck)! },
                    data: { images: JSON.stringify(imagesForColor) },
                  });
                }
              }
              colorId = colorMap.get(ck)!;
            }

            let sizeId: string | null = null;
            if (row.size) {
              const sk = row.size.trim().toLowerCase();
              if (!sizeMap.has(sk)) {
                const newSize = await prisma.productSize.create({
                  data: { productId, name: row.size.trim(), stock: row.stock },
                  select: { id: true },
                });
                sizeMap.set(sk, newSize.id);
              } else {
                await prisma.productSize.update({
                  where: { id: sizeMap.get(sk)! },
                  data: { stock: row.stock },
                });
              }
              sizeId = sizeMap.get(sk)!;
            }

            let existingVariant: { id: string } | null = null;
            if (row.barcode) {
              existingVariant = await prisma.productVariant.findFirst({
                where: { productId, barcode: row.barcode },
                select: { id: true },
              });
            }
            if (!existingVariant) {
              existingVariant = await prisma.productVariant.findFirst({
                where: {
                  productId,
                  colorId: colorId || null,
                  sizeId: sizeId || null,
                  dimension: row.dimension || null,
                },
                select: { id: true },
              });
            }

            const variantData = {
              barcode: row.barcode || null,
              dimension: row.dimension || null,
              supplierCode: row.supplierCode || null,
              stock: row.stock,
              price: row.salePrice || row.marketPrice || null,
              marketPrice: row.marketPrice || null,
              salePrice: row.salePrice || null,
              buyBoxPrice: row.buyBoxPrice || null,
              commissionRate: row.commissionRate || null,
              vatRate: row.vatRate || null,
              otvRate: row.otvRate || null,
              colorId,
              sizeId,
            };

            if (existingVariant) {
              await prisma.productVariant.update({
                where: { id: existingVariant.id },
                data: variantData,
              });
              updatedVariants++;
            } else {
              await prisma.productVariant.create({
                data: {
                  ...variantData,
                  productId,
                  variantCode: generateVariantCode(),
                },
              });
              createdVariants++;
            }
          } catch (rowErr: any) {
            errors.push({ group: groupKey, error: `Satır (${row.barcode || row.size}): ${rowErr.message}` });
          }
        }
      } catch (groupErr: any) {
        errors.push({ group: groupKey, error: groupErr.message });
      }
    }

    const validation = await validateImportedProductsColorConsistency(Array.from(touchedProductIds));

    return NextResponse.json({
      totalRows: rows.length,
      totalGroups: groups.size,
      createdProducts,
      updatedProducts,
      createdVariants,
      updatedVariants,
      createdCategories,
      errors,
      postImportValidation: validation,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message || "Import hatası" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });

    const buffer = toExcelBuffer(await file.arrayBuffer());
    const rawData = await readExcelRowsFromBuffer(buffer);

    const rows = parseRows(rawData);
    const groups = groupRows(rows);

    const preview = Array.from(groups.entries())
      .slice(0, 30)
      .map(([groupKey, gRows]) => ({
        groupKey,
        name: gRows[0].name || groupKey,
        brand: gRows[0].brand,
        category: gRows[0].category,
        gender: normalizeGender(gRows[0].gender),
        salePrice: gRows[0].salePrice,
        marketPrice: gRows[0].marketPrice,
        shipmentType: gRows[0].shipmentType,
        trendyolLink: gRows[0].trendyolLink,
        imageCount: gRows[0].images.length,
        variantCount: gRows.length,
        variants: gRows.slice(0, 5).map((r) => ({
          barcode: r.barcode,
          color: r.color,
          size: r.size,
          dimension: r.dimension,
          stock: r.stock,
          salePrice: r.salePrice,
        })),
      }));

    return NextResponse.json({
      totalRows: rawData.length,
      totalProducts: groups.size,
      preview,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
