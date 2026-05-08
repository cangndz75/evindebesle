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

        if (!session?.user?.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!ticket) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const order = ticket.orderId
            ? await prisma.order.findUnique({
                where: { id: ticket.orderId },
                select: {
                    orderNumber: true,
                    total: true,
                    status: true,
                },
            })
            : null;

        return NextResponse.json({
            ...ticket,
            order: order || undefined,
        });
    } catch (error) {
        console.error("[ADMIN_SUPPORT_DETAIL_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);

        if (!session?.user?.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status, priority, adminReply } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;

        if (adminReply) {
            await prisma.ticketMessage.create({
                data: {
                    ticketId: id,
                    content: adminReply,
                    isAdmin: true,
                    userId: session.user.id, // Optional depending on schema, but good for tracking
                },
            });
            updateData.updatedAt = new Date();

        }

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: updateData,
        });


        return NextResponse.json(ticket);
    } catch (error) {
        console.error("[ADMIN_SUPPORT_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
