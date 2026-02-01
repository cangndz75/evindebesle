import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag") || "kasa_onu";

    try {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                tags: {
                    some: {
                        name: {
                            contains: tag,
                            mode: 'insensitive',
                        },
                    },
                },
            },
            select: {
                id: true,
                name: true,
                price: true,
                image: true,
                slug: true,
                primaryImage: true,
            },
            take: 4,
        });

        const formattedProducts = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.primaryImage || p.image,
            slug: p.slug,
        }));

        return NextResponse.json(formattedProducts);
    } catch (error) {
        console.error("Upsell fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
