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
  COMMISSION:     "Komisyon OranÄ±",
  MODEL_CODE:     "Model Kodu",
  COLOR:          "ÃœrÃ¼n Rengi",
  SIZE:           "Beden",
  DIMENSION:      "Boyut/Ebat",
  GENDER:         "Cinsiyet",
  BRAND:          "Marka",
  CATEGORY:       "Kategori Ä°smi",
  SUPPLIER_CODE:  "TedarikÃ§i Stok Kodu",
  NAME:           "ÃœrÃ¼n AdÄ±",
  DESCRIPTION:    "ÃœrÃ¼n AÃ§Ä±klamasÄ±",
  MARKET_PRICE:   "Piyasa SatÄ±ÅŸ FiyatÄ± (KDV Dahil)",
  SALE_PRICE:     "Trendyol'da SatÄ±lacak Fiyat",
  BUYBOX_PRICE:   "BuyBox FiyatÄ±",
  STOCK:          "ÃœrÃ¼n Stok Adedi",
  VAT_RATE:       "KDV OranÄ±",
  OTV_RATE:       "Ã–TV OranÄ±",
  SHIPMENT_TYPE:  "Sevkiyat Tipi",
  IMAGE1:         "GÃ¶rsel 1",
  IMAGE2:         "GÃ¶rsel 2",
  IMAGE3:         "GÃ¶rsel 3",
  IMAGE4:         "GÃ¶rsel 4",
  IMAGE5:         "GÃ¶rsel 5",
  IMAGE6:         "GÃ¶rsel 6",
  IMAGE7:         "GÃ¶rsel 7",
  IMAGE8:         "GÃ¶rsel 8",
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

function normalizeGender(val: string): "FEMALE" | "MALE" | "UNISEX" | undefined {
  const v = val.toLowerCase();
  if (v.includes("kadÄ±n") || v.includes("kÄ±z") || v.includes("female")) return "FEMALE";
  if (v.includes("erkek") || v.includes("male")) return "MALE";
  if (v.includes("unisex")) return "UNISEX";
  return undefined;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ÄŸ/g, "g").replace(/Ã¼/g, "u").replace(/ÅŸ/g, "s")
    .replace(/Ä±/g, "i").replace(/Ã¶/g, "o").replace(/Ã§/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    ].map((k) => cleanUrl(row[k])).filter((u): u is string => u !== null),
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
    const key = row.modelCode
      || [row.name, row.brand, row.category].filter(Boolean).join("|")
      || row.barcode;
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
    if (!file) return NextResponse.json({ error: "Dosya bulunamadÄ±" }, { status: 400 });

    const buffer = toExcelBuffer(await file.arrayBuffer());
    const rawData = await readExcelRowsFromBuffer(buffer);

    if (!rawData.length) return NextResponse.json({ error: "Excel dosyasÄ± boÅŸ" }, { status: 400 });

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

    for (const [groupKey, groupRows] of groups) {
      try {
        const first = groupRows[0];
        const productName = first.name || groupKey;
        if (!productName) continue;

        const salePrice = first.salePrice || first.marketPrice || 0;
        const categoryId = await getCategoryId(first.category);
        const gender = normalizeGender(first.gender);

        const stockCode = first.modelCode || first.supplierCode || first.barcode || groupKey;

        let product = await prisma.product.findFirst({
          where: { stockCode },
          select: { id: true },
        });

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
          select: { id: true, name: true },
        });
        for (const c of existingColors) colorMap.set(c.name.trim().toLowerCase(), c.id);

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
                  data: { productId, name: row.color.trim() },
                  select: { id: true },
                });
                colorMap.set(ck, newColor.id);
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
            errors.push({ group: groupKey, error: `SatÄ±r (${row.barcode || row.size}): ${rowErr.message}` });
          }
        }
      } catch (groupErr: any) {
        errors.push({ group: groupKey, error: groupErr.message });
      }
    }

    return NextResponse.json({
      totalRows: rows.length,
      totalGroups: groups.size,
      createdProducts,
      updatedProducts,
      createdVariants,
      updatedVariants,
      createdCategories,
      errors,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message || "Import hatasÄ±" }, { status: 500 });
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
    if (!file) return NextResponse.json({ error: "Dosya bulunamadÄ±" }, { status: 400 });

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
