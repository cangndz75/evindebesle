import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { variantId, isVariant, stock } = await req.json();

        if (!variantId || stock < 0) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const newStock = Math.max(0, Number(stock));

        if (isVariant) {
            await prisma.productVariant.update({
                where: { id: variantId },
                data: { stock: newStock }
            });
        } else {
            await prisma.productSize.update({
                where: { id: variantId },
                data: { stock: newStock }
            });
        }

        // Audit log
        const user = session.user as any;
        await logAuditAction({
            action: "STOCK_UPDATE",
            adminId: user.id || "system",
            adminEmail: user.email || "system",
            targetType: "Product",
            targetId: variantId, // Using variant/size id as proxy
            details: {
                variantId,
                newStock,
                type: isVariant ? "variant" : "size"
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Stock update error:", error);
        return NextResponse.json(
            { error: "Stok güncellenemedi" },
            { status: 500 }
        );
    }
}
