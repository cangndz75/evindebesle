import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { title, height, size, gender, isActive } = body;

        const modelInfo = await prisma.modelInfo.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(height && { height }),
                ...(size && { size }),
                ...(gender !== undefined && { gender }),
                ...(typeof isActive === "boolean" && { isActive }),
            },
        });

        return NextResponse.json(modelInfo);
    } catch (error) {
        console.error("Error updating model info:", error);
        return NextResponse.json(
            { error: "Failed to update model info" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.modelInfo.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting model info:", error);
        return NextResponse.json(
            { error: "Failed to delete model info" },
            { status: 500 }
        );
    }
}
