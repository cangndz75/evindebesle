import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subMinutes } from "date-fns";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
    }

    try {
        const fiveMinutesAgo = subMinutes(new Date(), 5);

        const count = await prisma.productViewHistory.count({
            where: {
                productId,
                viewedAt: { gte: fiveMinutesAgo },
            },
        });

        const displayCount = count + Math.floor(Math.random() * 3) + 1;

        return NextResponse.json({ count: displayCount });
    } catch (error: any) {
        console.error("Live viewers error:", error);
        return NextResponse.json({ count: 0 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
        }

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
