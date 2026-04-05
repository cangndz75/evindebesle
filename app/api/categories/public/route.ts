import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                gender: true,
                group: true,
            },
        });

        return NextResponse.json(categories, {
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        });
    } catch (error: any) {
        console.error("Public categories fetch error:", error);
        return NextResponse.json(
            { error: "Kategoriler yüklenemedi" },
            { status: 500 }
        );
    }
}
