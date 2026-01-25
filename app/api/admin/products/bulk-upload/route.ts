import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { logAuditAction } from "@/lib/auditLog";
import { rateLimitCheck } from "@/lib/middleware/rateLimitMiddleware";
import { sanitizeString, sanitizePrice, sanitizeSlug } from "@/lib/sanitize";

interface CSVRow {
    name: string;
    stockCode?: string;
    description?: string;
    price: string;
    originalPrice?: string;
    category?: string;
    brand?: string;
    gender?: string;
    fabricType?: string;
    primaryImage?: string;
}

// POST: Toplu ürün yükleme (CSV)
export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const rateLimitError = rateLimitCheck(req, "upload");
        if (rateLimitError) return rateLimitError;

        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "CSV dosyası gerekli" },
                { status: 400 }
            );
        }

        // Read CSV content
        const csvContent = await file.text();
        const lines = csvContent.split("\n").map((line) => line.trim()).filter(Boolean);

        if (lines.length < 2) {
            return NextResponse.json(
                { error: "CSV dosyası boş veya geçersiz" },
                { status: 400 }
            );
        }

        // Parse header
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const requiredFields = ["name", "price"];
        const missingFields = requiredFields.filter((f) => !headers.includes(f));

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Eksik alanlar: ${missingFields.join(", ")}` },
                { status: 400 }
            );
        }

        // Parse rows
        const rows: CSVRow[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row: Record<string, string> = {};

            headers.forEach((header, index) => {
                row[header] = values[index] || "";
            });

            // Validate required fields
            if (!row.name || !row.price) {
                errors.push(`Satır ${i + 1}: name ve price zorunlu`);
                continue;
            }

            const price = sanitizePrice(row.price);
            if (price === null) {
                errors.push(`Satır ${i + 1}: Geçersiz fiyat`);
                continue;
            }

            rows.push({
                name: sanitizeString(row.name),
                stockCode: row.stockcode ? sanitizeString(row.stockcode) : undefined,
                description: row.description ? sanitizeString(row.description) : undefined,
                price: row.price,
                originalPrice: row.originalprice,
                category: row.category,
                brand: row.brand ? sanitizeString(row.brand) : undefined,
                gender: row.gender?.toUpperCase(),
                fabricType: row.fabrictype ? sanitizeString(row.fabrictype) : undefined,
                primaryImage: row.primaryimage,
            });
        }

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Geçerli ürün bulunamadı", details: errors },
                { status: 400 }
            );
        }

        // Get categories for mapping
        const categoryMap = new Map<string, string>();
        const categories = await prisma.category.findMany({
            select: { id: true, name: true, slug: true },
        });
        categories.forEach((c: any) => {
            categoryMap.set(c.name.toLowerCase(), c.id);
            categoryMap.set(c.slug.toLowerCase(), c.id);
        });

        // Create products
        const createdProducts: { id: string; name: string }[] = [];
        const skippedProducts: { name: string; reason: string }[] = [];

        for (const row of rows) {
            try {
                // Generate unique slug
                let slug = sanitizeSlug(row.name);
                let counter = 1;
                while (await prisma.product.findUnique({ where: { slug } })) {
                    slug = `${sanitizeSlug(row.name)}-${counter}`;
                    counter++;
                }

                // Check duplicate stock code
                if (row.stockCode) {
                    const existing = await prisma.product.findUnique({
                        where: { stockCode: row.stockCode },
                    });
                    if (existing) {
                        skippedProducts.push({
                            name: row.name,
                            reason: `Stok kodu zaten mevcut: ${row.stockCode}`,
                        });
                        continue;
                    }
                }

                // Get category ID
                const categoryId = row.category
                    ? categoryMap.get(row.category.toLowerCase())
                    : undefined;

                // Parse gender
                const gender =
                    row.gender === "MALE" || row.gender === "FEMALE" || row.gender === "UNISEX"
                        ? row.gender
                        : undefined;

                // Create product
                const product = await prisma.product.create({
                    data: {
                        name: row.name,
                        slug,
                        stockCode: row.stockCode,
                        description: row.description,
                        price: sanitizePrice(row.price) || 0,
                        originalPrice: row.originalPrice
                            ? sanitizePrice(row.originalPrice)
                            : undefined,
                        categoryId,
                        brand: row.brand,
                        gender: gender as "MALE" | "FEMALE" | "UNISEX" | undefined,
                        fabricType: row.fabricType,
                        primaryImage: row.primaryImage,
                        isActive: false, // Start inactive for review
                    },
                });

                createdProducts.push({
                    id: product.id,
                    name: product.name,
                });
            } catch (error) {
                console.error(`Error creating product ${row.name}:`, error);
                skippedProducts.push({
                    name: row.name,
                    reason: "Oluşturma hatası",
                });
            }
        }

        // Audit log
        await logAuditAction({
            action: "BULK_PRODUCT_IMPORT",
            adminId: user.id,
            adminEmail: user.email || "",
            targetType: "Product",
            details: {
                totalRows: rows.length,
                createdCount: createdProducts.length,
                skippedCount: skippedProducts.length,
                fileName: file.name,
            },
            ipAddress: req.headers.get("x-forwarded-for") || undefined,
            userAgent: req.headers.get("user-agent") || undefined,
        });

        return NextResponse.json({
            success: true,
            message: `${createdProducts.length} ürün oluşturuldu`,
            created: createdProducts,
            skipped: skippedProducts,
            parseErrors: errors.slice(0, 10), // Return first 10 parse errors
        });
    } catch (error) {
        console.error("Error in bulk upload:", error);
        return NextResponse.json(
            { error: "Yükleme sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}
