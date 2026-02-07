import { prisma } from "@/lib/db";

export type AdminNotificationType = "ORDER" | "STOCK" | "RETURN" | "SYSTEM" | "SUPPORT" | "PAYMENT";

interface CreateNotificationParams {
    type: AdminNotificationType;
    title: string;
    message: string;
    link?: string;
}

/**
 * Creates a new notification for admins.
 * This function should be called from API routes or server actions when important events occur.
 */
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
        // Silent fail to not disrupt the main flow (e.g. order creation)
        return null;
    }
}
