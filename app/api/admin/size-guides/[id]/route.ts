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
        const { title, imageUrl, content, isActive } = body;

        const sizeGuide = await prisma.sizeGuide.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(content !== undefined && { content }),
                ...(typeof isActive === "boolean" && { isActive }),
            },
        });

        return jsonNoStore(sizeGuide);
    } catch (error) {
        console.error("Error updating size guide:", error);
        return jsonNoStore(
            { error: "Failed to update size guide" },
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
        await prisma.sizeGuide.delete({
            where: { id },
        });

        return jsonNoStore({ success: true });
    } catch (error) {
        console.error("Error deleting size guide:", error);
        return jsonNoStore(
            { error: "Failed to delete size guide" },
            { status: 500 }
        );
    }
}
