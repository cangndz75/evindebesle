import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productGender = searchParams.get("productGender");
        const includeUnisex = searchParams.get("includeUnisex") === "true";
        const withProducts = searchParams.get("withProducts") === "true";

        const productGenders = productGender
            ? includeUnisex
                ? [productGender, "UNISEX"]
                : [productGender]
            : undefined;

        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
                ...(withProducts
                    ? {
                        products: {
                            some: {
                                isActive: true,
                                ...(productGenders ? { gender: { in: productGenders } } : {}),
                            },
                        },
                    }
                    : {}),
            },
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
                "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
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
