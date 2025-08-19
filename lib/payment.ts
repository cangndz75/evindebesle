import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";
import { generateAndSaveInvoice } from "@/lib/invoice/generateAndSaveInvoice";
import { createAdminNotification } from "@/lib/notifications/createAdminNotification";

export async function finalizeAppointmentFromDraftInternal(opts: {
  draftAppointmentId: string;
  userId: string;                    
  paidPrice: number;
  conversationId?: string | null;
  paymentId?: string | null;
}) {
  const { draftAppointmentId, userId, paidPrice, conversationId, paymentId } = opts;

  const draft = await prisma.draftAppointment.findFirst({
    where: { id: draftAppointmentId, userId },
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
      serviceIds: true,
      dates: true,
    },
  });
  if (!draft) throw new Error("Draft bulunamadı veya yetkisiz");

  const ownedPetIds = Array.isArray(draft.ownedPetIds) ? draft.ownedPetIds : [];
  const serviceIds = Array.isArray(draft.serviceIds) ? draft.serviceIds : [];
  const dateStrings = Array.isArray(draft.dates) ? draft.dates : [];

  if (!ownedPetIds.length) throw new Error("ownedPetIds boş");
  if (!serviceIds.length) throw new Error("serviceIds boş");
  if (!dateStrings.length) throw new Error("dates boş");

  const ownedPets = await prisma.ownedPet.findMany({
    where: { id: { in: ownedPetIds }, userId },
    select: { id: true, petId: true },
  });
  if (ownedPets.length !== ownedPetIds.length) {
    throw new Error("Geçersiz/Yetkisiz ownedPetIds");
  }
  const ownedMap = new Map(ownedPets.map((o) => [o.id, o]));

  const dates = dateStrings
    .map((s) => {
      const d = new Date(String(s).trim());
      return isNaN(d.getTime()) ? null : d;
    })
    .filter((d): d is Date => d !== null);
  if (!dates.length) throw new Error("Geçerli tarih bulunamadı");

  const foundServices = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true },
  });
  if (foundServices.length !== serviceIds.length) {
    throw new Error("Geçersiz serviceId'ler");
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const created = await tx.appointment.create({
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

    await tx.draftAppointment.delete({ where: { id: draftAppointmentId } });

    if (draft.couponId && Number(paidPrice) > 0) {
      const existingUsage = await tx.appointment.findFirst({
        where: { userId, couponId: draft.couponId, isPaid: true },
        select: { id: true },
      });
      if (!existingUsage) {
        await tx.coupon.update({
          where: { id: draft.couponId },
          data: { usageCount: { increment: 1 } },
        });
      }
      await tx.userCoupon.updateMany({
        where: { userId, couponId: draft.couponId },
        data: { usedAt: new Date() },
      });
    }

    return created;
  });

  try {
    await createAdminNotification({
      userId,
      type: "NEW_APPOINTMENT",
      message: `
        <p><strong>Yeni bir randevu oluşturuldu.</strong></p>
        <ul>
          <li><strong>Kullanıcı ID:</strong> ${userId}</li>
          <li><strong>Randevu ID:</strong> ${appointment.id}</li>
          <li><strong>Tarih:</strong> ${appointment.confirmedAt?.toLocaleString("tr-TR") || "-"}</li>
          <li><strong>Toplam Tutar:</strong> ${appointment.finalPrice?.toFixed(2) || "0"} ₺</li>
        </ul>`,
    });
  } catch (_) {}

  try {
    await generateAndSaveInvoice(appointment.id);
  } catch (_) {}

  return appointment;
}
