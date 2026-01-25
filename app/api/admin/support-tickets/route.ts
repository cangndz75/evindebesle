import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Kullanıcının ticket'larını veya admin için tüm ticket'ları listele
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

        // Admin tüm ticket'ları görebilir
        if (user.isAdmin) {
            if (status && status !== "all") {
                where.status = status;
            }
        } else {
            // Normal kullanıcı sadece kendi ticket'larını görebilir
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

        // Duruma göre sayılar
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

// POST: Yeni ticket oluştur
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

// PUT: Ticket güncelle (status, priority, mesaj ekle)
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

        // Ticket'ı kontrol et
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket bulunamadı" }, { status: 404 });
        }

        // Yetki kontrolü
        if (!user.isAdmin && ticket.userId !== user.id) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        // Durumu sadece admin değiştirebilir (closed hariç)
        const updateData: any = { updatedAt: new Date() };
        if (user.isAdmin && status) {
            updateData.status = status;
        }
        if (user.isAdmin && priority) {
            updateData.priority = priority;
        }

        // Kullanıcı çözülmüş ticket'ı kapatabilir
        if (!user.isAdmin && status === "closed" && ticket.status === "resolved") {
            updateData.status = "closed";
        }

        // Ticket'ı güncelle
        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: updateData,
        });

        // Mesaj varsa ekle
        if (message) {
            await prisma.ticketMessage.create({
                data: {
                    ticketId,
                    userId: user.id,
                    content: message,
                    isAdmin: user.isAdmin || false,
                },
            });

            // Kullanıcı cevap verdiyse durumu "pending" yap
            if (!user.isAdmin && ticket.status === "resolved") {
                await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: { status: "pending" },
                });
            }
        }

        // Güncel ticket'ı döndür
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
