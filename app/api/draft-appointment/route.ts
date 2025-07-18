import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    petIds,
    serviceIds,
    dates,
    userAddressId,
    timeSlot,
    isRecurring,
    recurringType,
    recurringCount,
  } = body;

  try {
    console.log("Gelen İstek:", JSON.stringify(body, null, 2));
    
    const draft = await prisma.draftAppointment.create({
      data: {
        userId: session.user.id,
        petIds: JSON.stringify(petIds),
        serviceIds: JSON.stringify(serviceIds),
        dates: JSON.stringify(dates),
        userAddressId,
        timeSlot,
        isRecurring,
        recurringType,
        recurringCount,
      },
    });

    return NextResponse.json({ draftAppointmentId: draft.id });
  } catch (error) {
    console.error("DraftAppointment oluşturulamadı:", error);
    return NextResponse.json({ error: "DB Hatası" }, { status: 500 });
  }
}
