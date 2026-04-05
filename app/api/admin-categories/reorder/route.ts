import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { logAuditAction } from "@/lib/auditLog";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "GeÃ§ersiz sÄ±ralama verisi" },
                { status: 400 }
            );
        }

        const updates = items.map((item: { id: string; sortOrder: number }) =>
            prisma.category.update({
                where: { id: item.id },
                data: { sortOrder: item.sortOrder },
            })
        );

        await prisma.$transaction(updates);

        await logAuditAction({
            action: "CATEGORY_UPDATE",
            adminId: session.user.id,
            adminEmail: session.user.email || "",
            targetType: "Category",
            details: {
                operation: "REORDER",
                itemCount: items.length,
            },
            ipAddress: request.headers.get("x-forwarded-for") || undefined,
            userAgent: request.headers.get("user-agent") || undefined,
        });

        const { revalidatePath } = await import("next/cache");
        revalidatePath("/");
        revalidatePath("/(public)/category/[slug]", "page");

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Category reorder error:", error);
        return NextResponse.json(
            { error: error.message || "SÄ±ralama gÃ¼ncellenirken bir hata oluÅŸtu" },
            { status: 500 }
        );
    }
}
