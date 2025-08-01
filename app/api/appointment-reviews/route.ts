import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId gerekli" }, { status: 400 });
    }

    const review = await prisma.appointmentReview.findFirst({
      where: {
        appointmentId,
        userId: session.user.id,
      },
    });

    if (!review) {
      return NextResponse.json({ review: null });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("❌ Yorumları getirirken hata:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { appointmentId, rating, comment } = parsed.data;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: session.user.id,
        status: "COMPLETED",
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Geçersiz veya tamamlanmamış randevu" },
        { status: 403 }
      );
    }

    const existing = await prisma.appointmentReview.findFirst({
      where: {
        appointmentId,
        userId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu randevu için zaten yorum yapıldı." },
        { status: 409 }
      );
    }

    const review = await prisma.appointmentReview.create({
      data: {
        appointmentId,
        userId: session.user.id,
        rating,
        comment,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("❌ Yorum oluşturulurken hata:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
