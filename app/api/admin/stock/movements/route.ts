import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin check
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        });

        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const movements = await prisma.stockMovement.findMany({
            include: {
                product: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
                variant: {
                    select: {
                        // Depending on how Variant is structured...
                        // Checking schema, ProductVariant has colorId, sizeId.
                        // But we might need to fetch Color and Size names. 
                        // ProductVariant relations: color: ProductColor, size: ProductSize
                        color: { select: { name: true } },
                        size: { select: { name: true } },
                    },
                },
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100,
        });

        // Map variant to flatter structure
        const formattedMovements = movements.map((m) => ({
            id: m.id,
            type: m.type,
            quantity: m.quantity,
            reason: m.reason,
            createdAt: m.createdAt,
            product: m.product,
            variant: m.variant ? {
                colorName: m.variant.color?.name,
                sizeName: m.variant.size?.name,
            } : null,
            user: m.user,
        }));

        return NextResponse.json(formattedMovements);
    } catch (error: any) {
        console.error("Stock movements error:", error);
        return NextResponse.json(
            { error: "Stok hareketleri yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}
