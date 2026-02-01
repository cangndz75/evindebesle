import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const deliveryInfos = await prisma.deliveryInfo.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(deliveryInfos);
    } catch (error) {
        console.error("Error fetching delivery info:", error);
        return NextResponse.json(
            { error: "Failed to fetch delivery info" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: "Title and content are required" },
                { status: 400 }
            );
        }

        const deliveryInfo = await prisma.deliveryInfo.create({
            data: {
                title,
                content,
                isActive: true,
            },
        });

        return NextResponse.json(deliveryInfo, { status: 201 });
    } catch (error) {
        console.error("Error creating delivery info:", error);
        return NextResponse.json(
            { error: "Failed to create delivery info" },
            { status: 500 }
        );
    }
}
