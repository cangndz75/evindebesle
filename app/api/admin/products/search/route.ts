import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Ürün arama (ProductBlock için)
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const query = url.searchParams.get("q") || "";
        const limit = parseInt(url.searchParams.get("limit") || "20");

        if (!query.trim()) {
            const products = await prisma.product.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    originalPrice: true,
                    primaryImage: true,
                    slug: true,
                },
                take: limit,
                orderBy: { updatedAt: "desc" },
            });
            return NextResponse.json({ products });
        }

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                name: {
                    contains: query,
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
                primaryImage: true,
                slug: true,
            },
            take: limit,
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Error searching products:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
