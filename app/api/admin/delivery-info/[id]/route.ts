import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    try {
        const body = await request.json();
        const { title, content, isActive } = body;

        const deliveryInfo = await prisma.deliveryInfo.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(typeof isActive === "boolean" && { isActive }),
            },
        });

        return jsonNoStore(deliveryInfo);
    } catch (error) {
        console.error("Error updating delivery info:", error);
        return jsonNoStore(
            { error: "Failed to update delivery info" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    try {
        await prisma.deliveryInfo.delete({
            where: { id },
        });

        return jsonNoStore({ success: true });
    } catch (error) {
        console.error("Error deleting delivery info:", error);
        return jsonNoStore(
            { error: "Failed to delete delivery info" },
            { status: 500 }
        );
    }
}
