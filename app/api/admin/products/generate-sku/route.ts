import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { generateUniqueStockCode, generateMissingStockCodes } from "@/lib/skuGenerator";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const type = url.searchParams.get("type") || "count";

        if (type === "count") {
            const count = await prisma.product.count({
                where: {
                    OR: [{ stockCode: null }, { stockCode: "" }],
                },
            });

            return NextResponse.json({ missingCount: count });
        }

        const products = await prisma.product.findMany({
            where: {
                OR: [{ stockCode: null }, { stockCode: "" }],
            },
            select: {
                id: true,
                name: true,
                brand: true,
            },
            take: 50,
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Error fetching products without SKU:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId, generateAll } = await req.json();

        if (productId) {
            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: {
                    id: true,
                    name: true,
                    brand: true,
                    gender: true,
                    stockCode: true,
                },
            });

            if (!product) {
                return NextResponse.json(
                    { error: "ÃœrÃ¼n bulunamadÄ±" },
                    { status: 404 }
                );
            }

            if (product.stockCode) {
                return NextResponse.json(
                    { error: "Bu Ã¼rÃ¼nÃ¼n zaten bir stok kodu var", stockCode: product.stockCode },
                    { status: 400 }
                );
            }

            const categoryPrefix =
                product.gender === "FEMALE"
                    ? "K"
                    : product.gender === "MALE"
                        ? "E"
                        : "U";

            const stockCode = await generateUniqueStockCode({
                categoryPrefix,
                brandPrefix: product.brand || undefined,
            });

            await prisma.product.update({
                where: { id: productId },
                data: { stockCode },
            });

            return NextResponse.json({
                success: true,
                stockCode,
                productName: product.name,
            });
        }

        if (generateAll) {
            const result = await generateMissingStockCodes();

            return NextResponse.json({
                success: true,
                message: `${result.updated} Ã¼rÃ¼n iÃ§in stok kodu oluÅŸturuldu`,
                updated: result.updated,
                failed: result.failed,
            });
        }

        return NextResponse.json(
            { error: "productId veya generateAll parametresi gerekli" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error generating SKU:", error);
        return NextResponse.json(
            { error: "Stok kodu oluÅŸturulurken hata oluÅŸtu" },
            { status: 500 }
        );
    }
}
