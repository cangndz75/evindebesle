import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
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

  // Opsiyonel: test bayrağı
  isTest: z.boolean().optional(),

  // Opsiyonel: satır bazında miktar gönderirsen Tami basket kurallarına birebir yaklaşır
  lineItems: z.array(z.object({
    serviceId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).optional(),

  // Güvenlik: client totalPrice kabul etmiyoruz (gelirse da görmezden geleceğiz)
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
    // backward compat: petIds → ownedPetIds
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
      lineItems,
      // totalPrice (bilerek kullanılmıyor)
    } = parsed.data;

    // --- Aidiyet ve doğrulamalar ---

    // OwnedPet aidiyet
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

    // Adres aidiyet
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

    // Tarihleri normalize et
    const normalizedDates = dates
      .map(toMidnightISO)
      .filter((v): v is string => Boolean(v));

    if (normalizedDates.length === 0) {
      return NextResponse.json(
        { error: "Geçerli tarih bulunamadı" },
        { status: 400 }
      );
    }

    // Geçmiş tarih engeli (opsiyonel ama faydalı)
    const todayMid = toMidnightISO(new Date().toISOString());
    if (todayMid && normalizedDates.some(d => d < todayMid)) {
      // İstersen soft allow yapabilirsin, burada örnek olsun diye engelliyorum
      // return NextResponse.json({ error: "Geçmiş tarihe randevu oluşturulamaz" }, { status: 400 });
    }

    // petIds'i OwnedPet'ten türet (bilgi amaçlı)
    const petIds = Array.from(
      new Set(ownedPets.map((p) => p.petId).filter(Boolean) as string[])
    );

    // --- Fiyat hesaplama sunucuda ---
    // Gün sayısı
    const uniqueDayCount = new Set(normalizedDates).size || 1;

    // Satırların belirlenmesi
    const totalSelectedPets = ownedPets.length;
    const rawLines = (lineItems && lineItems.length)
      ? lineItems
      : serviceIds.map((sid) => ({ serviceId: sid, quantity: totalSelectedPets }));

    // Satır toplamları
    const lineTotals = rawLines.map((li) => {
      const svc = svcMap.get(li.serviceId)!;
      const unitPrice = Number(svc.price || 0);
      const qty = Number(li.quantity || 0);
      const subtotal = unitPrice * qty;
      return { serviceId: li.serviceId, unitPrice, qty, subtotal };
    });

    const baseTotal = lineTotals.reduce((s, x) => s + x.subtotal, 0);
    const amount = baseTotal * uniqueDayCount;

    // --- Draft create ---
    const draft = await prisma.draftAppointment.create({
      data: {
        userId: session.user.id,
        userAddressId,
        timeSlot: timeSlot ?? null,
        isRecurring,
        recurringType: recurringType ?? null,
        recurringCount: recurringCount ?? null,

        // Güvenli: server hesapladığı tutarı yazar
        finalPrice: Number(amount),

        // İsteğe bağlı test işareti
        ...(typeof isTest === "boolean" ? { isTest } : {}),

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
