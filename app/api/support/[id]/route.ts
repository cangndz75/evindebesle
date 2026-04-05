import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const ticket = await prisma.supportTicket.findUnique({
            where: {
                id,
                userId: session.user.id, // Ensure user owns the ticket
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                    include: {
                    }
                },
            },
        });

        if (!ticket) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("[SUPPORT_TICKET_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content) {
            return new NextResponse("Message content required", { status: 400 });
        }

        const ticket = await prisma.supportTicket.findUnique({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!ticket) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                userId: session.user.id,
                content,
                isAdmin: false,
            },
        });

        if (ticket.status === "resolved" || ticket.status === "closed") {
            await prisma.supportTicket.update({
                where: { id },
                data: { status: "open", updatedAt: new Date() }
            });
        } else {
            await prisma.supportTicket.update({
                where: { id },
                data: { updatedAt: new Date() }
            });
        }

        return NextResponse.json(message);
    } catch (error) {
        console.error("[SUPPORT_TICKET_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
