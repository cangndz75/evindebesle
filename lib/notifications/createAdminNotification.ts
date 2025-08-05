import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";

export const NotificationTypes = {
  NEW_USER: "Yeni Kullanıcı Kaydı",
  NEW_APPOINTMENT: "Yeni Randevu",
  NEW_REVIEW: "Yeni Yorum",
} as const;

export type NotificationType = keyof typeof NotificationTypes;

export async function createAdminNotification({
  userId,
  type,
  message,
}: {
  userId: string;
  type: NotificationType;
  message: string;
}) {
  const displayTitle = NotificationTypes[type];

  try {
    await resend.emails.send({
      from: "noreply@evindebesle.com",
      to: "evindebesle34@gmail.com",
      subject: `[${displayTitle}] Yeni Bildirim`,
      html: `<div style="font-family: sans-serif; line-height: 1.5;">
        <h2>${displayTitle}</h2>
        <p>${message}</p>
        <hr />
        <small>Bu e-posta sistem tarafından otomatik gönderilmiştir.</small>
      </div>`,
    });

    await prisma.notificationLog.create({
      data: {
        userId,
        type,
        message,
        success: true,
      },
    });
  } catch (error) {
    await prisma.notificationLog.create({
      data: {
        userId,
        type,
        message,
        success: false,
        retryCount: 1,
      },
    });
  }
}
