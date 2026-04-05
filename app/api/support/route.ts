import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authConfig);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { subject, category, message, orderId, priority = "normal" } = body;

        if (!subject || !category || !message) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                userId: session.user.id,
                subject,
                category,
                priority,
                orderId: orderId || undefined,
                status: "open",
                messages: {
                    create: {
                        content: message,
                        userId: session.user.id,
                        isAdmin: false,
                    },
                },
            },
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("[SUPPORT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authConfig);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const tickets = await prisma.supportTicket.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                updatedAt: "desc",
            },
            include: {
                _count: {
                    select: { messages: true },
                },
            },
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error("[SUPPORT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
