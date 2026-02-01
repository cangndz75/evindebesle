import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { title, content, isActive } = body;

        const deliveryInfo = await prisma.deliveryInfo.update({
            where: { id: params.id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(typeof isActive === "boolean" && { isActive }),
            },
        });

        return NextResponse.json(deliveryInfo);
    } catch (error) {
        console.error("Error updating delivery info:", error);
        return NextResponse.json(
            { error: "Failed to update delivery info" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.deliveryInfo.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting delivery info:", error);
        return NextResponse.json(
            { error: "Failed to delete delivery info" },
            { status: 500 }
        );
    }
}
