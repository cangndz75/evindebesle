import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { logAuditAction } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productIds, action } = await req.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json(
                { error: "Ürün ID'leri gerekli" },
                { status: 400 }
            );
        }

        if (!["archive", "restore", "delete"].includes(action)) {
            return NextResponse.json(
                { error: "Geçersiz işlem. archive, restore veya delete olmalı" },
                { status: 400 }
            );
        }

        let updatedCount = 0;

        if (action === "archive") {
            const result = await prisma.product.updateMany({
                where: { id: { in: productIds }, deletedAt: null },
                data: { isActive: false },
            });
            updatedCount = result.count;
        } else if (action === "restore") {
            const result = await prisma.product.updateMany({
                where: { id: { in: productIds }, deletedAt: null },
                data: { isActive: true },
            });
            updatedCount = result.count;
        } else if (action === "delete") {
            const productsWithOrders = await prisma.product.findMany({
                where: {
                    id: { in: productIds },
                    deletedAt: null,
                    orderItems: { some: {} },
                },
                select: { id: true, name: true },
            });

            if (productsWithOrders.length > 0) {
                return NextResponse.json(
                    {
                        error: "Siparişi olan ürünler silinemez. Bunun yerine arşivleyin.",
                        products: productsWithOrders.map((p: any) => p.name),
                    },
                    { status: 400 }
                );
            }

            const deleteIds = productIds.filter(
                (id: string) => !productsWithOrders.find((p: any) => p.id === id)
            );

            if (deleteIds.length > 0) {
                const result = await prisma.product.updateMany({
                    where: { id: { in: deleteIds } },
                    data: {
                        deletedAt: new Date(),
                        isActive: false,
                    },
                });
                updatedCount = result.count;
            }
        }

        await logAuditAction({
            action: "PRODUCT_UPDATE",
            adminId: user.id,
            adminEmail: user.email || "",
            targetType: "Product",
            details: {
                action,
                productCount: updatedCount,
                productIds,
            },
            ipAddress: req.headers.get("x-forwarded-for") || undefined,
            userAgent: req.headers.get("user-agent") || undefined,
        });

        const actionText = ({
            archive: "arşivlendi",
            restore: "geri yüklendi",
            delete: "silindi",
        } as any)[action];

        return NextResponse.json({
            success: true,
            message: `${updatedCount} ürün ${actionText}`,
            count: updatedCount,
        });
    } catch (error) {
        console.error("Error in archive operation:", error);
        return NextResponse.json(
            { error: "İşlem sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
