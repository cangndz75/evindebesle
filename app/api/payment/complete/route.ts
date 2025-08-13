import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { z } from "zod";
import { AppointmentStatus } from "@/lib/generated/prisma";
import { generateAndSaveInvoice } from "@/lib/invoice/generateAndSaveInvoice";
import { createAdminNotification } from "@/lib/notifications/createAdminNotification";

const completeSchema = z.object({
  draftAppointmentId: z.string().uuid("Geçersiz draftAppointmentId"),
  // Test modunda 0 olabilir
  paidPrice: z.number().min(0, "Geçersiz paidPrice"),
  conversationId: z.string().optional(),
  paymentId: z.string().optional(),
});

function parseDates(dateStrings: string[]) {
  const dates = dateStrings
    .map((s) => {
      const d = new Date(String(s).trim());
      return isNaN(d.getTime()) ? null : d;
    })
    .filter((d): d is Date => d !== null);
  return dates;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.warn("❌ Yetkisiz istek: Kullanıcı oturumu bulunamadı");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 Complete isteği alındı:", body);

    // Zod doğrulama
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("⚠️ Geçersiz veri:", parsed.error);
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error },
        { status: 400 }
      );
    }

    const { draftAppointmentId, paidPrice, conversationId, paymentId } = parsed.data;

    // Taslak çek (kullanıcı sahipliği dahil)
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
        // ⬇️ Asıl gerekli alanlar
        ownedPetIds: true,
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
      console.warn("⚠️ Eksik ownedPetIds:", { draftAppointmentId });
      return NextResponse.json(
        { error: "ownedPetIds boş" },
        { status: 400 }
      );
    }
    if (!serviceIds.length) {
      console.warn("⚠️ Eksik serviceIds:", { draftAppointmentId });
      return NextResponse.json({ error: "serviceIds boş" }, { status: 400 });
    }
    if (!dateStrings.length) {
      console.warn("⚠️ Eksik dates:", { draftAppointmentId });
      return NextResponse.json({ error: "dates boş" }, { status: 400 });
    }

    // OwnedPet doğrulaması ve Pet eşlemesi
    const ownedPets = await prisma.ownedPet.findMany({
      where: { id: { in: ownedPetIds }, userId: session.user.id },
      select: { id: true, petId: true },
    });
    if (ownedPets.length !== ownedPetIds.length) {
      const validSet = new Set(ownedPets.map((o) => o.id));
      const invalid = ownedPetIds.filter((x) => !validSet.has(x));
      console.warn("⚠️ Geçersiz/Yetkisiz ownedPetIds:", invalid);
      return NextResponse.json(
        { error: "Geçersiz veya yetkisiz ownedPetIds", invalid },
        { status: 400 }
      );
    }
    const ownedMap = new Map(ownedPets.map((o) => [o.id, o]));

    // Tarihleri parse et
    const dates = parseDates(dateStrings);
    if (!dates.length) {
      console.warn("⚠️ Geçersiz tarihler:", dateStrings);
      return NextResponse.json(
        { error: "Geçerli tarih bulunamadı" },
        { status: 400 }
      );
    }

    // Hizmet varlık doğrulaması
    const foundServices = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true },
    });
    if (foundServices.length !== serviceIds.length) {
      const ok = new Set(foundServices.map((s) => s.id));
      const missing = serviceIds.filter((x) => !ok.has(x));
      console.warn("⚠️ Geçersiz serviceId'ler:", missing);
      return NextResponse.json(
        { error: "Geçersiz serviceId'ler", invalidServiceIds: missing },
        { status: 400 }
      );
    }

    // Transaction: randevu oluştur + draft sil + kupon kullanım güncelle
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
          finalPrice: Number(paidPrice),
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

          // OwnedPet'e göre güvenli eşleme (Pet bağlantısı da varsa eklenir)
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

      // Kupon kullanımını (ilk ücretli kullanımda) güncelle
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

    // Transaction DIŞI: bildirim ve fatura (başarısız olursa randevu yine de başarılı)
    try {
      await createAdminNotification({
        userId: session.user.id,
        type: "NEW_APPOINTMENT",
        message: `
          <p><strong>Yeni bir randevu oluşturuldu.</strong></p>
          <ul>
            <li><strong>Kullanıcı:</strong> ${session.user.name} (${session.user.email})</li>
            <li><strong>Randevu ID:</strong> ${created.id}</li>
            <li><strong>Tarih:</strong> ${created.confirmedAt?.toLocaleString("tr-TR") || "-"}</li>
            <li><strong>Toplam Tutar:</strong> ${created.finalPrice?.toFixed(2) || "0"} ₺</li>
            <li><strong>Seçilen Hizmetler:</strong>
              <ul>
                ${created.services.map((s) => `<li>${s.service.name} - ${s.service.price} ₺</li>`).join("")}
              </ul>
            </li>
          </ul>
        `,
      });
    } catch (e) {
      console.error("⚠️ Admin bildirimi oluşturulamadı:", e);
    }

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
    console.error("💥 payment/complete hatası:", error);
    return NextResponse.json(
      {
        error: "Randevu oluşturulamadı",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}