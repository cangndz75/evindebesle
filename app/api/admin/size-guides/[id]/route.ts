import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { title, imageUrl, content, isActive } = body;

        const sizeGuide = await prisma.sizeGuide.update({
            where: { id: params.id },
            data: {
                ...(title && { title }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(content !== undefined && { content }),
                ...(typeof isActive === "boolean" && { isActive }),
            },
        });

        return NextResponse.json(sizeGuide);
    } catch (error) {
        console.error("Error updating size guide:", error);
        return NextResponse.json(
            { error: "Failed to update size guide" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.sizeGuide.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting size guide:", error);
        return NextResponse.json(
            { error: "Failed to delete size guide" },
            { status: 500 }
        );
    }
}
