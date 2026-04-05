import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50");

        let where: any = {};

        if (user.isAdmin) {
            if (status && status !== "all") {
                where.status = status;
            }
        } else {
            where.userId = user.id;
        }

        const tickets = await prisma.supportTicket.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });

        const counts = user.isAdmin
            ? await prisma.supportTicket.groupBy({
                by: ["status"],
                _count: true,
            })
            : null;

        return NextResponse.json({ tickets, counts });
    } catch (error: any) {
        console.error("Tickets fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { subject, category, message, orderId, priority } = body;

        if (!subject || !category || !message) {
            return NextResponse.json({ error: "Konu, kategori ve mesaj zorunlu" }, { status: 400 });
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                userId: user.id,
                subject,
                category,
                orderId: orderId || null,
                priority: priority || "normal",
                messages: {
                    create: {
                        userId: user.id,
                        content: message,
                        isAdmin: false,
                    },
                },
            },
            include: {
                messages: true,
            },
        });

        return NextResponse.json(ticket);
    } catch (error: any) {
        console.error("Ticket create error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { ticketId, status, priority, message } = body;

        if (!ticketId) {
            return NextResponse.json({ error: "ticketId zorunlu" }, { status: 400 });
        }

        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket bulunamadÄ±" }, { status: 404 });
        }

        if (!user.isAdmin && ticket.userId !== user.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const updateData: any = { updatedAt: new Date() };
        if (user.isAdmin && status) {
            updateData.status = status;
        }
        if (user.isAdmin && priority) {
            updateData.priority = priority;
        }

        if (!user.isAdmin && status === "closed" && ticket.status === "resolved") {
            updateData.status = "closed";
        }

        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: updateData,
        });

        if (message) {
            await prisma.ticketMessage.create({
                data: {
                    ticketId,
                    userId: user.id,
                    content: message,
                    isAdmin: user.isAdmin || false,
                },
            });

            if (!user.isAdmin && ticket.status === "resolved") {
                await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: { status: "pending" },
                });
            }
        }

        const updatedTicket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(updatedTicket);
    } catch (error: any) {
        console.error("Ticket update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
