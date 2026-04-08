import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { generateVariantCode, generateProductSlug } from "@/lib/slug";
import { syncSizeStocksFromVariants } from "@/lib/stock";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

function isStockCodeUniqueError(error: unknown): boolean {
  const target: string[] =
    typeof error === "object" &&
    error !== null &&
    "meta" in error &&
    Array.isArray((error as { meta?: { target?: string[] } }).meta?.target)
      ? (error as { meta?: { target?: string[] } }).meta?.target ?? []
      : [];

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002" &&
    target.includes("stockCode")
  );
}

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
  SALE_PRICE:     ["Trendyol'da Satılacak Fiyat", "Trendyol'da Satılacak Fiyat (KDV Dahil)"],
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
  TRENDYOL_LINK:  ["Trendyol Linki", "Trendyol.com Linki"],
};

function getRowValue(row: any, key: string | string[]): unknown {
  const keys = Array.isArray(key) ? key : [key];

  for (const currentKey of keys) {
    const value = row[currentKey];
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }

  return row[keys[0]];
}

function str(row: any, key: string | string[]): string {
  const v = getRowValue(row, key);
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function num(row: any, key: string | string[]): number {
  const v = getRowValue(row, key);
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

const COLOR_PREFIXES = [
  ...Array.from(COLOR_TOKENS),
  "çok renkli",
  "cok renkli",
  "multicolor",
  "multi color",
  "renkli",
];

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
  const trimmedName = String(name || "").trim();
  if (!trimmedName) return "";

  const words = trimmedName.split(/\s+/);
  const normalizedWords = words.map((word) => normalizeForKey(word));
  const candidatePrefixes = [
    normalizeForKey(color || ""),
    ...COLOR_PREFIXES.map((token) => normalizeForKey(token)),
  ].filter(Boolean);

  for (const prefix of candidatePrefixes) {
    const prefixWords = prefix.split(" ").filter(Boolean);
    if (prefixWords.length === 0 || prefixWords.length > words.length) continue;

    const startsWithPrefix = prefixWords.every((prefixWord, index) => normalizedWords[index] === prefixWord);
    if (startsWithPrefix) {
      return words.slice(prefixWords.length).join(" ").trim();
    }
  }

  return trimmedName;
}

function buildProductIdentityKey(row: ExcelRow): string {
  const baseName = normalizeForKey(stripLeadingColorFromName(row.name, row.color) || row.name);
  const modelKey = normalizeForKey(row.modelCode || "");
  const brandKey = normalizeForKey(row.brand || "");
  const categoryKey = normalizeForKey(row.category || "");

  if (modelKey) {
    return modelKey;
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

interface ImportedColor {
  name: string;
  images: string[];
}

interface ImportedVariant {
  barcode: string;
  color: string;
  size: string;
  dimension: string;
  stock: number;
  supplierCode: string;
  marketPrice: number;
  salePrice: number;
  buyBoxPrice: number;
  commissionRate: number;
  vatRate: number;
  otvRate: number;
  images: string[];
}

interface ImportedProduct {
  identityKey: string;
  stockCode: string;
  legacyStockCode: string;
  modelCode: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  gender: "FEMALE" | "MALE" | "UNISEX" | undefined;
  shipmentType: string;
  trendyolLink: string;
  price: number;
  originalPrice: number;
  primaryImage: string | null;
  secondaryImage: string | null;
  images: string[];
  colors: ImportedColor[];
  variants: ImportedVariant[];
}

function firstNonEmptyString(values: string[]): string {
  for (const value of values) {
    if (String(value || "").trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function firstPositiveNumber(values: number[]): number {
  for (const value of values) {
    if (value > 0) {
      return value;
    }
  }
  return 0;
}

function resolveImportedProductName(groupRows: ExcelRow[], fallback: string): string {
  const candidates = new Map<string, { value: string; count: number }>();

  for (const row of groupRows) {
    const candidate = stripLeadingColorFromName(row.name, row.color) || row.name || fallback;
    const normalizedCandidate = normalizeForKey(candidate);
    if (!normalizedCandidate) continue;

    const current = candidates.get(normalizedCandidate);
    if (current) {
      current.count += 1;
      continue;
    }

    candidates.set(normalizedCandidate, {
      value: String(candidate).trim(),
      count: 1,
    });
  }

  const sorted = Array.from(candidates.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.value.length - right.value.length;
  });

  return sorted[0]?.value || fallback;
}

function buildImportProducts(rows: ExcelRow[]): ImportedProduct[] {
  const groups = groupRows(rows);

  return Array.from(groups.entries()).map(([groupKey, groupRows]) => {
    const first = groupRows[0];
    const identityKey = buildProductIdentityKey(first) || groupKey;
    const modelCode = firstNonEmptyString(groupRows.map((row) => row.modelCode));
    const fallbackSupplierCode = firstNonEmptyString(groupRows.map((row) => row.supplierCode));
    const fallbackBarcode = firstNonEmptyString(groupRows.map((row) => row.barcode));
    const stockCode = modelCode || fallbackSupplierCode || fallbackBarcode || identityKey;
    const legacyStockCode = identityKey;
    const name = resolveImportedProductName(groupRows, first.name || groupKey);
    const description = firstNonEmptyString(groupRows.map((row) => row.description));
    const brand = firstNonEmptyString(groupRows.map((row) => row.brand));
    const category = firstNonEmptyString(groupRows.map((row) => row.category));
    const shipmentType = firstNonEmptyString(groupRows.map((row) => row.shipmentType));
    const trendyolLink = firstNonEmptyString(groupRows.map((row) => row.trendyolLink));
    const colorMap = new Map<string, ImportedColor>();
    const colorOrder: string[] = [];
    const imageSet = new Set<string>();

    for (const row of groupRows) {
      for (const image of row.images || []) {
        if (image) {
          imageSet.add(image);
        }
      }

      const normalizedColor = normalizeForKey(row.color);
      if (!normalizedColor) continue;

      if (!colorMap.has(normalizedColor)) {
        colorOrder.push(normalizedColor);
        colorMap.set(normalizedColor, {
          name: row.color.trim(),
          images: [],
        });
      }

      const currentColor = colorMap.get(normalizedColor)!;
      currentColor.images = Array.from(new Set([...currentColor.images, ...(row.images || [])]));
    }

    const images = Array.from(imageSet);

    return {
      identityKey,
      stockCode,
      legacyStockCode,
      modelCode,
      name,
      description,
      brand,
      category,
      gender: normalizeGender(firstNonEmptyString(groupRows.map((row) => row.gender))),
      shipmentType,
      trendyolLink,
      price: firstPositiveNumber(groupRows.map((row) => row.salePrice || row.marketPrice)),
      originalPrice: firstPositiveNumber(groupRows.map((row) => row.marketPrice)),
      primaryImage: images[0] || null,
      secondaryImage: images[1] || null,
      images,
      colors: colorOrder.map((key) => colorMap.get(key)!).filter(Boolean),
      variants: groupRows.map((row) => ({
        barcode: row.barcode,
        color: row.color,
        size: row.size,
        dimension: row.dimension,
        stock: row.stock,
        supplierCode: row.supplierCode,
        marketPrice: row.marketPrice,
        salePrice: row.salePrice,
        buyBoxPrice: row.buyBoxPrice,
        commissionRate: row.commissionRate,
        vatRate: row.vatRate,
        otvRate: row.otvRate,
        images: row.images || [],
      })),
    };
  });
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
    const importedProducts = buildImportProducts(rows);

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

    for (const importedProduct of importedProducts) {
      try {
        const productName = importedProduct.name || importedProduct.modelCode || importedProduct.stockCode;
        if (!productName) continue;

        const salePrice = importedProduct.price || importedProduct.originalPrice || 0;
        const categoryId = await getCategoryId(importedProduct.category);
        const gender = importedProduct.gender;
        const stockCode = importedProduct.stockCode;
        const legacyStockCode = importedProduct.legacyStockCode;

        let product = await prisma.product.findFirst({
          where: {
            OR: [
              { stockCode },
              { stockCode: legacyStockCode },
              ...(importedProduct.modelCode ? [{ modelCode: importedProduct.modelCode }] : []),
            ],
          },
          select: { id: true, name: true, stockCode: true },
        });

        if (product) {
          const importedBaseName = normalizeForKey(importedProduct.name);
          const existingBaseName = stripLeadingColorFromName(product.name, "");
          if (importedBaseName && existingBaseName && importedBaseName !== normalizeForKey(existingBaseName)) {
            product = null;
          }
        }

        if (!product) {
          const firstColorName = importedProduct.colors[0]?.name || null;
          let slug = generateProductSlug(productName, importedProduct.category || null, firstColorName);
          const existingSlug = await prisma.product.findFirst({ where: { slug } });
          if (existingSlug) slug = `${slug}-${Date.now()}`;

          try {
            product = await prisma.product.create({
              data: {
                name: productName,
                slug,
                stockCode,
                modelCode: importedProduct.modelCode || null,
                description: importedProduct.description || null,
                price: salePrice,
                originalPrice: importedProduct.originalPrice || null,
                gender,
                brand: importedProduct.brand || null,
                categoryId,
                isActive: true,
                shipmentType: importedProduct.shipmentType || null,
                trendyolLink: importedProduct.trendyolLink || null,
                primaryImage: importedProduct.primaryImage,
                secondaryImage: importedProduct.secondaryImage,
                image: importedProduct.primaryImage,
              },
              select: { id: true },
            });
            createdProducts++;
          } catch (createError) {
            if (!isStockCodeUniqueError(createError) || !stockCode) {
              throw createError;
            }

            const existingByStockCode = await prisma.product.findUnique({
              where: { stockCode },
              select: { id: true },
            });

            if (!existingByStockCode) {
              throw createError;
            }

            await prisma.product.update({
              where: { id: existingByStockCode.id },
              data: {
                name: productName,
                modelCode: importedProduct.modelCode || undefined,
                description: importedProduct.description || undefined,
                price: salePrice || undefined,
                originalPrice: importedProduct.originalPrice || undefined,
                gender: gender || undefined,
                brand: importedProduct.brand || undefined,
                categoryId: categoryId || undefined,
                shipmentType: importedProduct.shipmentType || undefined,
                trendyolLink: importedProduct.trendyolLink || undefined,
                primaryImage: importedProduct.primaryImage || undefined,
                secondaryImage: importedProduct.secondaryImage || undefined,
                image: importedProduct.primaryImage || undefined,
              },
            });

            product = { id: existingByStockCode.id };
            updatedProducts++;
          }
        } else {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              stockCode,
              name: productName,
              modelCode: importedProduct.modelCode || undefined,
              description: importedProduct.description || undefined,
              price: salePrice || undefined,
              originalPrice: importedProduct.originalPrice || undefined,
              gender: gender || undefined,
              brand: importedProduct.brand || undefined,
              categoryId: categoryId || undefined,
              shipmentType: importedProduct.shipmentType || undefined,
              trendyolLink: importedProduct.trendyolLink || undefined,
              primaryImage: importedProduct.primaryImage || undefined,
              secondaryImage: importedProduct.secondaryImage || undefined,
              image: importedProduct.primaryImage || undefined,
            },
          });
          updatedProducts++;
        }

        const productId = product.id;
        touchedProductIds.add(productId);

        for (let i = 0; i < importedProduct.images.slice(0, 2).length; i++) {
          const url = importedProduct.images[i];
          const exists = await prisma.productImage.findFirst({
            where: { productId, colorId: null, url },
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
          select: { id: true, name: true },
        });
        for (const c of existingColors) {
          const ck = c.name.trim().toLowerCase();
          colorMap.set(ck, c.id);
        }

        for (const color of importedProduct.colors) {
          const colorKey = color.name.trim().toLowerCase();
          if (!colorMap.has(colorKey)) {
            const newColor = await prisma.productColor.create({
              data: {
                productId,
                name: color.name.trim(),
                images: JSON.stringify(color.images || []),
              },
              select: { id: true },
            });
            colorMap.set(colorKey, newColor.id);
          } else {
            await prisma.productColor.update({
              where: { id: colorMap.get(colorKey)! },
              data: {
                images: JSON.stringify(color.images || []),
              },
            });
          }

          const colorId = colorMap.get(colorKey)!;
          for (let imageIndex = 0; imageIndex < color.images.length; imageIndex++) {
            const imageUrl = color.images[imageIndex];
            const existingImage = await prisma.productImage.findFirst({
              where: { productId, colorId, url: imageUrl },
              select: { id: true },
            });

            if (!existingImage) {
              await prisma.productImage.create({
                data: {
                  productId,
                  colorId,
                  url: imageUrl,
                  order: imageIndex,
                  isPrimary: imageIndex === 0,
                  isSecondary: imageIndex > 0,
                  alt: `${productName} - ${color.name}`,
                },
              });
            }
          }
        }

        const sizeMap = new Map<string, string>();
        const existingSizes = await prisma.productSize.findMany({
          where: { productId },
          select: { id: true, name: true },
        });
        for (const s of existingSizes) sizeMap.set(s.name.trim().toLowerCase(), s.id);

        const sizeTotals = new Map<string, number>();
        for (const variant of importedProduct.variants) {
          const sizeKey = variant.size.trim().toLowerCase();
          if (!sizeKey) continue;
          sizeTotals.set(sizeKey, (sizeTotals.get(sizeKey) || 0) + variant.stock);
        }

        for (const [sizeKey, totalStock] of sizeTotals) {
          const sizeName = importedProduct.variants.find((variant) => variant.size.trim().toLowerCase() === sizeKey)?.size.trim() || "";
          if (!sizeName) continue;

          if (!sizeMap.has(sizeKey)) {
            const newSize = await prisma.productSize.create({
              data: { productId, name: sizeName, stock: totalStock },
              select: { id: true },
            });
            sizeMap.set(sizeKey, newSize.id);
          } else {
            await prisma.productSize.update({
              where: { id: sizeMap.get(sizeKey)! },
              data: { stock: totalStock },
            });
          }
        }

        for (const row of importedProduct.variants) {
          try {
            let colorId: string | null = null;
            if (row.color) {
              const ck = row.color.trim().toLowerCase();
              colorId = colorMap.get(ck) || null;
            }

            let sizeId: string | null = null;
            if (row.size) {
              const sk = row.size.trim().toLowerCase();
              sizeId = sizeMap.get(sk) || null;
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
            errors.push({ group: importedProduct.modelCode || importedProduct.stockCode, error: `Satır (${row.barcode || row.size}): ${rowErr.message}` });
          }
        }

        await syncSizeStocksFromVariants(productId);
      } catch (groupErr: any) {
        errors.push({ group: importedProduct.modelCode || importedProduct.stockCode, error: groupErr.message });
      }
    }

    const validation = await validateImportedProductsColorConsistency(Array.from(touchedProductIds));

    return NextResponse.json({
      totalRows: rows.length,
      totalGroups: importedProducts.length,
      total: importedProducts.length,
      created: createdProducts,
      updated: updatedProducts,
      skipped: 0,
      createdProducts,
      updatedProducts,
      createdVariants,
      updatedVariants,
      createdCategories,
      errors: errors.map((entry) => ({
        ...entry,
        modelCode: entry.group,
      })),
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
    const importedProducts = buildImportProducts(rows);

    const preview = importedProducts.slice(0, 30).map((product) => ({
      modelCode: product.modelCode || product.stockCode,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      gender: product.gender,
      imageCount: product.images.length,
      variants: product.variants.slice(0, 5).map((variant) => ({
        barcode: variant.barcode,
        color: variant.color,
        size: variant.size,
        stock: variant.stock,
      })),
    }));

    return NextResponse.json({
      totalRows: rawData.length,
      totalProducts: importedProducts.length,
      preview,
      convertedProducts: importedProducts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
