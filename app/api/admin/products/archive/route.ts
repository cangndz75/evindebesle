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
                { error: "ÃœrÃ¼n ID'leri gerekli" },
                { status: 400 }
            );
        }

        if (!["archive", "restore", "delete"].includes(action)) {
            return NextResponse.json(
                { error: "GeÃ§ersiz iÅŸlem. archive, restore veya delete olmalÄ±" },
                { status: 400 }
            );
        }

        let updatedCount = 0;

        if (action === "archive") {
            const result = await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { isActive: false },
            });
            updatedCount = result.count;
        } else if (action === "restore") {
            const result = await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { isActive: true },
            });
            updatedCount = result.count;
        } else if (action === "delete") {
            const productsWithOrders = await prisma.product.findMany({
                where: {
                    id: { in: productIds },
                    orderItems: { some: {} },
                },
                select: { id: true, name: true },
            });

            if (productsWithOrders.length > 0) {
                return NextResponse.json(
                    {
                        error: "SipariÅŸi olan Ã¼rÃ¼nler silinemez. Bunun yerine arÅŸivleyin.",
                        products: productsWithOrders.map((p: any) => p.name),
                    },
                    { status: 400 }
                );
            }

            const deleteIds = productIds.filter(
                (id: string) => !productsWithOrders.find((p: any) => p.id === id)
            );

            if (deleteIds.length > 0) {
                const result = await prisma.product.deleteMany({
                    where: { id: { in: deleteIds } },
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
            archive: "arÅŸivlendi",
            restore: "geri yÃ¼klendi",
            delete: "silindi",
        } as any)[action];

        return NextResponse.json({
            success: true,
            message: `${updatedCount} Ã¼rÃ¼n ${actionText}`,
            count: updatedCount,
        });
    } catch (error) {
        console.error("Error in archive operation:", error);
        return NextResponse.json(
            { error: "Ä°ÅŸlem sÄ±rasÄ±nda bir hata oluÅŸtu" },
            { status: 500 }
        );
    }
}
