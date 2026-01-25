import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subMinutes } from "date-fns";

// GET: Aktif görüntüleyici sayısını al
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
    }

    try {
        // Son 5 dakika içinde görüntüleyenleri say
        const fiveMinutesAgo = subMinutes(new Date(), 5);

        const count = await prisma.productViewHistory.count({
            where: {
                productId,
                viewedAt: { gte: fiveMinutesAgo },
            },
        });

        // Minimum 1-3 arası random sayı ekle (social proof için)
        const displayCount = count + Math.floor(Math.random() * 3) + 1;

        return NextResponse.json({ count: displayCount });
    } catch (error: any) {
        console.error("Live viewers error:", error);
        return NextResponse.json({ count: 0 });
    }
}

// POST: Görüntüleme kaydet
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
        }

        // Görüntüleme kaydı oluştur (userId yoksa anonim)
        await prisma.productViewHistory.create({
            data: {
                productId,
                viewedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("View registration error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
