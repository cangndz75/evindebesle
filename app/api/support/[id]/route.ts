import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Get ticket details and messages
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.email) {
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
                        // If message userId exists, include user name/image?
                        // Usually not needed for simple chat, but good to have context
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

// Add a new message (Reply)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content) {
            return new NextResponse("Message content required", { status: 400 });
        }

        // Verify ownership
        const ticket = await prisma.supportTicket.findUnique({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!ticket) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Add message and potentially update ticket status
        const message = await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                userId: session.user.id,
                content,
                isAdmin: false,
            },
        });

        // If ticket was resolved/closed, reopen it? 
        // Usually good practice to set status to 'open' or 'pending' on user reply
        if (ticket.status === "resolved" || ticket.status === "closed") {
            await prisma.supportTicket.update({
                where: { id },
                data: { status: "open", updatedAt: new Date() }
            });
        } else {
            // Just update timestamp
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
