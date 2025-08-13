// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";
import { z } from "zod";
import { createAdminNotification } from "@/lib/notifications/createAdminNotification";
import { generateAndSaveInvoice } from "@/lib/invoice/generateAndSaveInvoice";

// --- GET: Kullanıcının randevularını getir ---
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: { confirmedAt: "desc" },
      include: {
        pets: {
          select: {
            ownedPet: {
              // Şemanızda "userPetName" yoksa "name" kullanın.
              select: { name: true, image: true },
            },
            pet: {
              select: { name: true },
            },
          },
        },
        services: {
          include: {
            service: {
              select: { name: true, price: true },
            },
          },
        },
        address: {
          select: {
            fullAddress: true,
            district: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: appointments }, { status: 200 });
  } catch (error) {
    console.error("📛 Kullanıcı randevu listesi hatası:", error);
    return NextResponse.json(
      { success: false, message: "Randevular alınamadı." },
      { status: 500 }
    );
  }
}

// --- Helpers ---
const completeSchema = z.object({
  draftAppointmentId: z.string().uuid("Geçersiz draftAppointmentId"),
  paidPrice: z.number().min(0, "Geçersiz paidPrice"),
  conversationId: z.string().optional(),
  paymentId: z.string().optional(),
});

// ISO string dizi → Date[]
function parseDates(dateStrings: string[]) {
  const dates = dateStrings
    .map((s) => {
      const d = new Date(String(s).trim());
      return isNaN(d.getTime()) ? null : d;
    })
    .filter((d): d is Date => d !== null);
  return dates;
}

// --- POST: Taslaktan randevuyu TAMAMLA ---
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const raw = await req.json();

    // Geri uyumluluk: appointmentId geldiyse draftAppointmentId olarak kabul et
    if (raw?.appointmentId && !raw?.draftAppointmentId) {
      raw.draftAppointmentId = raw.appointmentId;
      delete raw.appointmentId;
    }

    const parsed = completeSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn("⚠️ Geçersiz veri:", parsed.error);
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { draftAppointmentId, paidPrice, conversationId, paymentId } = parsed.data;

    // Taslağı KULLANICI SAHİPLİĞİ ile çek
    const draft = await prisma.draftAppointment.findFirst({
      where: { id: draftAppointmentId, userId: session.user.id },
      select: {
        id: true,
        userId: true,
        userAddressId: true,
        isRecurring: true,
        recurringType: true,
        recurringCount: true,
        timeSlot: true,
        couponId: true,
        userNote: true,
        allergy: true,
        sensitivity: true,
        specialRequest: true,
        ownedPetIds: true,
        petIds: true, // sadece yardımcı bilgi
        serviceIds: true,
        dates: true,
      },
    });

    if (!draft) {
      console.warn("⚠️ Draft bulunamadı veya yetkisiz:", {
        draftAppointmentId,
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: "Draft bulunamadı veya yetkisiz" },
        { status: 404 }
      );
    }

    const ownedPetIds = Array.isArray(draft.ownedPetIds) ? draft.ownedPetIds : [];
    const serviceIds = Array.isArray(draft.serviceIds) ? draft.serviceIds : [];
    const dateStrings = Array.isArray(draft.dates) ? draft.dates : [];

    if (!ownedPetIds.length) {
      return NextResponse.json({ error: "ownedPetIds boş" }, { status: 400 });
    }
    if (!serviceIds.length) {
      return NextResponse.json({ error: "serviceIds boş" }, { status: 400 });
    }
    if (!dateStrings.length) {
      return NextResponse.json({ error: "dates boş" }, { status: 400 });
    }

    // OwnedPet aitlik doğrulaması + petId eşlemesi
    const ownedPets = await prisma.ownedPet.findMany({
      where: { id: { in: ownedPetIds }, userId: session.user.id },
      select: { id: true, petId: true },
    });
    if (ownedPets.length !== ownedPetIds.length) {
      const validSet = new Set(ownedPets.map((o) => o.id));
      const invalid = ownedPetIds.filter((x) => !validSet.has(x));
      return NextResponse.json(
        { error: "Geçersiz veya yetkisiz ownedPetIds", invalid },
        { status: 400 }
      );
    }
    const ownedMap = new Map(ownedPets.map((o) => [o.id, o]));

    // Hizmet doğrulaması
    const foundServices = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    });
    if (foundServices.length !== serviceIds.length) {
      const ok = new Set(foundServices.map((s) => s.id));
      const missing = serviceIds.filter((x) => !ok.has(x));
      return NextResponse.json(
        { error: "Geçersiz serviceId'ler", invalidServiceIds: missing },
        { status: 400 }
      );
    }

    // Tarihler
    const dates = parseDates(dateStrings);
    if (!dates.length) {
      return NextResponse.json(
        { error: "Geçerli tarih bulunamadı" },
        { status: 400 }
      );
    }

    // Transaction: randevu oluştur + draft sil + kupon güncelle
    const created = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          userId: draft.userId,
          userAddressId: draft.userAddressId,
          timeSlot: draft.timeSlot,
          isRecurring: draft.isRecurring,
          recurringType: draft.recurringType,
          recurringCount: draft.recurringCount,
          status: AppointmentStatus.SCHEDULED,
          // Appointment.finalPrice şemada Float? => number veriyoruz
          finalPrice: paidPrice,
          paidAt: new Date(),
          isPaid: true,
          confirmedAt: new Date(),
          paymentConversationId: conversationId || null,
          paymentId: paymentId || null,
          couponId: draft.couponId || null,
          userNote: draft.userNote || null,
          allergy: draft.allergy || null,
          sensitivity: draft.sensitivity || null,
          specialRequest: draft.specialRequest || null,

          services: {
            create: serviceIds.map((sid) => ({
              service: { connect: { id: sid } },
            })),
          },

          pets: {
            create: ownedPetIds.map((ownedId) => {
              const owned = ownedMap.get(ownedId);
              return {
                ownedPet: { connect: { id: ownedId } },
                ...(owned?.petId ? { pet: { connect: { id: owned.petId } } } : {}),
              };
            }),
          },

          dates: {
            create: dates.map((d) => ({ date: d })),
          },
        },
        include: {
          services: { include: { service: true } },
          pets: { include: { pet: true, ownedPet: true } },
        },
      });

      // Taslağı sil
      await tx.draftAppointment.delete({ where: { id: draftAppointmentId } });

      // Kupon kullanımını (sadece ücretli ilk kullanımda) güncelle
      if (draft.couponId && Number(paidPrice) > 0) {
        const existingUsage = await tx.appointment.findFirst({
          where: {
            userId: session.user.id,
            couponId: draft.couponId,
            isPaid: true,
          },
          select: { id: true },
        });

        if (!existingUsage) {
          await tx.coupon.update({
            where: { id: draft.couponId },
            data: { usageCount: { increment: 1 } },
          });
        }

        await tx.userCoupon.updateMany({
          where: { userId: session.user.id, couponId: draft.couponId },
          data: { usedAt: new Date() },
        });
      }

      return appointment;
    });

    // Transaction DIŞI: admin bildirimi
    try {
      await createAdminNotification({
        userId: session.user.id,
        type: "NEW_APPOINTMENT",
        message: `
          <p><strong>Yeni bir randevu oluşturuldu.</strong></p>
          <ul>
            <li><strong>Kullanıcı:</strong> ${session.user.name ?? "-"} (${session.user.email ?? "-"})</li>
            <li><strong>Randevu ID:</strong> ${created.id}</li>
            <li><strong>Tarih:</strong> ${created.confirmedAt?.toLocaleString("tr-TR") || "-"}</li>
            <li><strong>Toplam Tutar:</strong> ${created.finalPrice ?? 0} ₺</li>
            <li><strong>Seçilen Hizmetler:</strong>
              <ul>
                ${created.services
                  .map((s) => `<li>${s.service.name} - ${s.service.price ?? 0} ₺</li>`)
                  .join("")}
              </ul>
            </li>
          </ul>
        `,
      });
    } catch (e) {
      console.error("⚠️ Admin bildirimi oluşturulamadı:", e);
    }

    // Transaction DIŞI: fatura
    try {
      await generateAndSaveInvoice(created.id);
    } catch (e) {
      console.error("⚠️ Fatura üretilemedi:", e);
    }

    console.log("✅ Randevu oluşturuldu:", created.id);
    return NextResponse.json(
      { success: true, appointmentId: created.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 /api/appointments POST hatası:", error);
    return NextResponse.json(
      {
        error: "Randevu oluşturulamadı",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
