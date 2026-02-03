import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await prisma.order.findUnique({
        where: { id: id },
        include: { payment: true, items: true },
    });

    if (!order) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
        orderId: order.id,
        orderNo: order.orderNumber,
        orderStatus: order.status,
        paymentStatus: order.payment?.status,
        reservedUntil: order.reservedUntil,
        total: order.total,
        items: order.items
    });
}
