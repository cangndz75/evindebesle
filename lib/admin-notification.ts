import { prisma } from "@/lib/db";

export type AdminNotificationType = "ORDER" | "STOCK" | "RETURN" | "SYSTEM" | "SUPPORT" | "PAYMENT" | "REVIEW";

interface CreateNotificationParams {
    type: AdminNotificationType;
    title: string;
    message: string;
    link?: string;
}

export async function createAdminNotification({
    type,
    title,
    message,
    link
}: CreateNotificationParams) {
    try {
        const notification = await prisma.adminNotification.create({
            data: {
                type,
                title,
                message,
                link,
                isRead: false,
            }
        });
        return notification;
    } catch (error) {
        console.error("Failed to create admin notification:", error);
        return null;
    }
}
