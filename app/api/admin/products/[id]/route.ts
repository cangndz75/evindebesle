import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                colors: true,
                sizes: true,
                variants: {
                    include: {
                        color: true,
                        size: true,
                    },
                },
                category: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Ürün bulunamadı" },
                { status: 404 }
            );
        }

        return NextResponse.json({ product });
    } catch (error: any) {
        console.error("Product fetch error:", error);
        return NextResponse.json(
            { error: "Ürün yüklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
