import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const modelInfos = await prisma.modelInfo.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(modelInfos);
    } catch (error) {
        console.error("Error fetching model info:", error);
        return NextResponse.json(
            { error: "Failed to fetch model info" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, height, size, gender } = body;

        if (!title || !height || !size) {
            return NextResponse.json(
                { error: "Title, height, and size are required" },
                { status: 400 }
            );
        }

        const modelInfo = await prisma.modelInfo.create({
            data: {
                title,
                height,
                size,
                gender,
                isActive: true,
            },
        });

        return NextResponse.json(modelInfo, { status: 201 });
    } catch (error) {
        console.error("Error creating model info:", error);
        return NextResponse.json(
            { error: "Failed to create model info" },
            { status: 500 }
        );
    }
}
