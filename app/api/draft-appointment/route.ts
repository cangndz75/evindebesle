import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { z } from "zod";

const schema = z.object({
  ownedPetIds: z.array(z.string().uuid()).min(1, "En az bir ownedPetId gerekli"),
  serviceIds: z.array(z.string().uuid()).min(1, "En az bir serviceId gerekli"),
  dates: z.array(z.string()).min(1, "En az bir tarih gerekli"),
  userAddressId: z.string().uuid("Geçersiz userAddressId"),
  timeSlot: z.string().optional(),
  isRecurring: z.boolean(),
  recurringType: z.string().optional(),
  recurringCount: z.number().int().min(1).optional(),

  // Opsiyonel
  isTest: z.boolean().optional(),
  couponId: z.string().uuid().optional(),

  lineItems: z.array(
    z.object({
      serviceId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ).optional(),

  totalPrice: z.number().min(0).optional(), 
});

function toMidnightISO(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // backward compat
    if (Array.isArray(body.petIds) && !Array.isArray(body.ownedPetIds)) {
      body.ownedPetIds = body.petIds;
      delete body.petIds;
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      ownedPetIds,
      serviceIds,
      dates,
      userAddressId,
      timeSlot,
      isRecurring,
      recurringType,
      recurringCount,
      isTest = false,
      couponId,
      lineItems,
    } = parsed.data;

    // Aidiyet ve doğrulamalar

    // OwnedPet doğrulama
    const ownedPets = await prisma.ownedPet.findMany({
      where: { id: { in: ownedPetIds }, userId: session.user.id },
      select: { id: true, petId: true },
    });
    if (ownedPets.length !== ownedPetIds.length) {
      const valid = new Set(ownedPets.map((p) => p.id));
      const invalid = ownedPetIds.filter((id) => !valid.has(id));
      return NextResponse.json(
        { error: "Geçersiz veya yetkisiz ownedPetIds", invalidOwnedPetIds: invalid },
        { status: 400 }
      );
    }

    // Service doğrulama
    const svcList = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    });
    if (svcList.length !== serviceIds.length) {
      const valid = new Set(svcList.map((s) => s.id));
      const invalid = serviceIds.filter((id) => !valid.has(id));
      return NextResponse.json(
        { error: "Geçersiz serviceId'ler", invalidServiceIds: invalid },
        { status: 400 }
      );
    }
    const svcMap = new Map(svcList.map((s) => [s.id, s]));

    // Adres doğrulama
    const address = await prisma.userAddress.findFirst({
      where: { id: userAddressId, userId: session.user.id },
      select: { id: true },
    });
    if (!address) {
      return NextResponse.json(
        { error: "Geçersiz veya yetkisiz userAddressId" },
        { status: 400 }
      );
    }

    // Tarihler normalize
    const normalizedDates = dates
      .map(toMidnightISO)
      .filter((v): v is string => Boolean(v));
    if (normalizedDates.length === 0) {
      return NextResponse.json({ error: "Geçerli tarih bulunamadı" }, { status: 400 });
    }

    // Geçmiş tarih engeli (opsiyonel)
    const todayMid = toMidnightISO(new Date().toISOString());
    if (todayMid && normalizedDates.some((d) => d < todayMid)) {
      // burayı soft allow bırakabiliriz
    }

    const petIds = Array.from(
      new Set(ownedPets.map((p) => p.petId).filter(Boolean) as string[])
    );

    // Gün sayısı
    const uniqueDayCount = new Set(normalizedDates).size || 1;

    // Satırlar
    const totalSelectedPets = ownedPets.length;
    const rawLines = (lineItems && lineItems.length)
      ? lineItems
      : serviceIds.map((sid) => ({ serviceId: sid, quantity: totalSelectedPets }));

    const lineTotals = rawLines.map((li) => {
      const svc = svcMap.get(li.serviceId)!;
      const unitPrice = Number(svc.price || 0);
      const qty = Number(li.quantity || 0);
      const subtotal = unitPrice * qty;
      return { serviceId: li.serviceId, unitPrice, qty, subtotal };
    });

    const baseTotal = lineTotals.reduce((s, x) => s + x.subtotal, 0);
    const amount = baseTotal * uniqueDayCount;

    let finalPrice = amount;
    if (couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
      if (coupon) {
        if (coupon.discountType === "PERCENT") {
          finalPrice = Math.max(amount - (amount * coupon.value) / 100, 0);
        } else {
          finalPrice = Math.max(amount - coupon.value, 0);
        }
      }
    }

    // Draft create
    const draft = await prisma.draftAppointment.create({
      data: {
        userId: session.user.id,
        userAddressId,
        timeSlot: timeSlot ?? null,
        isRecurring,
        recurringType: recurringType ?? null,
        recurringCount: recurringCount ?? null,
        finalPrice: new Prisma.Decimal(finalPrice),
        ...(typeof isTest === "boolean" ? { isTest } : {}),
        ...(couponId ? { couponId } : {}),

        ownedPetIds,
        petIds,
        serviceIds,
        dates: normalizedDates,
      },
      select: { id: true, finalPrice: true },
    });

    return NextResponse.json(
      { success: true, draftAppointmentId: draft.id, finalPrice: draft.finalPrice },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ POST /api/draft-appointment hatası:", error);
    return NextResponse.json(
      { error: "Draft appointment oluşturulamadı" },
      { status: 500 }
    );
  }
}
