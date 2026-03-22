import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { generateVariantCode, generateProductSlug } from "@/lib/slug";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

// Excel kolon adları → alan mapping
const COL = {
  BARCODE: "Barkod",
  MODEL_CODE: "Model Kodu",
  COLOR: "Ürün Rengi",
  SIZE: "Beden",
  GENDER: "Cinsiyet",
  STOCK: "Ürün Stok Adedi",
  WEIGHT: "Desi",
  IMAGE1: "Görsel 1",
  IMAGE2: "Görsel 2",
  IMAGE3: "Görsel 3",
  IMAGE4: "Görsel 4",
  IMAGE5: "Görsel 5",
  IMAGE6: "Görsel 6",
  IMAGE7: "Görsel 7",
  IMAGE8: "Görsel 8",
  BRAND: "Marka",
  CATEGORY: "Kategori İsmi",
  SUPPLIER_CODE: "Tedarikçi Stok Kodu",
  NAME: "Ürün Adı",
  DESCRIPTION: "Ürün Açıklaması",
  ORIGINAL_PRICE: "Piyasa Satış Fiyatı (KDV Dahil)",
  PRICE: "idyol'da Satılacak Fiyat (KDV Dahil)",
};

function normalizeGender(val: string | undefined): "FEMALE" | "MALE" | "UNISEX" | undefined {
  if (!val) return undefined;
  const v = val.toLowerCase().trim();
  if (v.includes("kadın") || v.includes("kız") || v.includes("female")) return "FEMALE";
  if (v.includes("erkek") || v.includes("male")) return "MALE";
  if (v.includes("unisex") || v.includes("uni̇sex")) return "UNISEX";
  return undefined;
}

function cleanImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed.startsWith("http")) return null;
  return trimmed;
}

function getString(row: any, key: string): string {
  const val = row[key];
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

function getNumber(row: any, key: string): number {
  const val = row[key];
  if (val === undefined || val === null || val === "") return 0;
  const n = parseFloat(String(val).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

interface ExcelRow {
  barcode: string;
  modelCode: string;
  color: string;
  size: string;
  gender: string;
  stock: number;
  weight: number;
  images: string[];
  brand: string;
  category: string;
  supplierCode: string;
  name: string;
  description: string;
  originalPrice: number;
  price: number;
}

function parseRows(data: any[]): ExcelRow[] {
  return data.map((row) => ({
    barcode: getString(row, COL.BARCODE),
    modelCode: getString(row, COL.MODEL_CODE),
    color: getString(row, COL.COLOR),
    size: getString(row, COL.SIZE),
    gender: getString(row, COL.GENDER),
    stock: getNumber(row, COL.STOCK),
    weight: getNumber(row, COL.WEIGHT),
    images: [
      COL.IMAGE1, COL.IMAGE2, COL.IMAGE3, COL.IMAGE4,
      COL.IMAGE5, COL.IMAGE6, COL.IMAGE7, COL.IMAGE8,
    ]
      .map((k) => cleanImageUrl(row[k]))
      .filter((u): u is string => u !== null),
    brand: getString(row, COL.BRAND),
    category: getString(row, COL.CATEGORY),
    supplierCode: getString(row, COL.SUPPLIER_CODE),
    name: getString(row, COL.NAME),
    description: getString(row, COL.DESCRIPTION),
    originalPrice: getNumber(row, COL.ORIGINAL_PRICE),
    price: getNumber(row, COL.PRICE),
  }));
}

// stockCode ile ürünlere göre satırları grupla
function groupByModelCode(rows: ExcelRow[]) {
  const map = new Map<string, ExcelRow[]>();
  for (const row of rows) {
    const key = row.modelCode || row.supplierCode || row.barcode;
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
    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (rawData.length === 0) {
      return NextResponse.json({ error: "Excel dosyası boş" }, { status: 400 });
    }

    const rows = parseRows(rawData);
    const groups = groupByModelCode(rows);

    // Kategori önbelleği
    const categoryCache = new Map<string, string | null>();
    async function getCategoryId(name: string): Promise<string | null> {
      if (!name) return null;
      if (categoryCache.has(name)) return categoryCache.get(name)!;
      const cat = await prisma.category.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true },
      });
      categoryCache.set(name, cat?.id ?? null);
      return cat?.id ?? null;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: { modelCode: string; error: string }[] = [];

    for (const [modelCode, groupRows] of groups) {
      try {
        const first = groupRows[0];
        const stockCode = first.supplierCode || modelCode;
        const productName = first.name || modelCode;
        if (!productName) { skipped++; continue; }

        const price = first.price || first.originalPrice || 0;
        if (price === 0) { skipped++; continue; }

        const categoryId = await getCategoryId(first.category);
        const gender = normalizeGender(first.gender);

        // Mevcut ürün kontrolü
        let existingProduct = await prisma.product.findFirst({
          where: { stockCode },
          include: {
            colors: true,
            sizes: true,
            variants: true,
            productImages: true,
          },
        });

        if (!existingProduct) {
          // Slug oluştur
          let slug = generateProductSlug(productName, first.category || null, first.color || null);
          const slugExists = await prisma.product.findFirst({ where: { slug } });
          if (slugExists) slug = `${slug}-${Date.now()}`;

          existingProduct = await prisma.product.create({
            data: {
              name: productName,
              slug,
              stockCode,
              barcode: first.barcode || undefined,
              description: first.description || undefined,
              price,
              originalPrice: first.originalPrice || undefined,
              gender,
              brand: first.brand || undefined,
              categoryId: categoryId || undefined,
              weight: first.weight || undefined,
              isActive: true,
              image: first.images[0] || undefined,
              primaryImage: first.images[0] || undefined,
              secondaryImage: first.images[1] || undefined,
            },
            include: {
              colors: true,
              sizes: true,
              variants: true,
              productImages: true,
            },
          });
          created++;
        } else {
          updated++;
        }

        const productId = existingProduct.id;

        // Her satır → renk + beden kombinasyonu
        for (const row of groupRows) {
          if (!row.color && !row.size) continue;

          // Renk
          let colorRecord = existingProduct.colors.find(
            (c: any) => c.name.toLowerCase() === row.color.toLowerCase()
          );
          if (!colorRecord && row.color) {
            colorRecord = await prisma.productColor.create({
              data: {
                productId,
                name: row.color,
                images: row.images.length > 0 ? JSON.stringify(row.images) : null,
              },
            });
            // Görseller
            for (let i = 0; i < row.images.length; i++) {
              await prisma.productImage.create({
                data: {
                  productId,
                  colorId: colorRecord.id,
                  url: row.images[i],
                  order: i,
                  isPrimary: i === 0,
                  isSecondary: i === 1,
                  alt: `${productName} - ${row.color}`,
                },
              });
            }
          }

          // Beden
          let sizeRecord = existingProduct.sizes.find(
            (s: any) => s.name.toLowerCase() === row.size.toLowerCase()
          );
          if (!sizeRecord && row.size) {
            sizeRecord = await prisma.productSize.create({
              data: {
                productId,
                name: row.size,
                stock: row.stock,
              },
            });
          } else if (sizeRecord && row.size) {
            // Stoğu güncelle
            await prisma.productSize.update({
              where: { id: sizeRecord.id },
              data: { stock: { increment: row.stock } },
            });
          }

          // Varyant
          if (colorRecord && sizeRecord) {
            const variantExists = existingProduct.variants.find(
              (v: any) => v.colorId === colorRecord!.id && v.sizeId === sizeRecord!.id
            );
            if (!variantExists) {
              await prisma.productVariant.create({
                data: {
                  productId,
                  colorId: colorRecord.id,
                  sizeId: sizeRecord.id,
                  variantCode: generateVariantCode(),
                  stock: row.stock,
                },
              });
            }
          }
        }
      } catch (err: any) {
        errors.push({ modelCode, error: err.message });
      }
    }

    return NextResponse.json({ created, updated, skipped, errors, total: groups.size });
  } catch (error: any) {
    console.error("Excel import error:", error);
    return NextResponse.json(
      { error: error.message || "Import sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Preview endpoint - dosyayı parse et, ilk 30 satırı döndür
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    const rows = parseRows(rawData);
    const groups = groupByModelCode(rows);

    const preview = Array.from(groups.entries())
      .slice(0, 30)
      .map(([modelCode, groupRows]) => ({
        modelCode,
        name: groupRows[0].name || modelCode,
        brand: groupRows[0].brand,
        category: groupRows[0].category,
        price: groupRows[0].price,
        originalPrice: groupRows[0].originalPrice,
        gender: normalizeGender(groupRows[0].gender),
        variants: groupRows.map((r) => ({
          color: r.color,
          size: r.size,
          stock: r.stock,
          barcode: r.barcode,
        })),
        imageCount: groupRows[0].images.length,
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
