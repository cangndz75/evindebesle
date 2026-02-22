import { prisma } from "@/lib/db";

export type AuditAction =
    | "PRODUCT_CREATE"
    | "PRODUCT_UPDATE"
    | "PRODUCT_DELETE"
    | "ORDER_STATUS_CHANGE"
    | "COUPON_CREATE"
    | "COUPON_UPDATE"
    | "USER_ROLE_CHANGE"
    | "CAMPAIGN_SEND"
    | "SETTINGS_UPDATE"
    | "BULK_PRICE_UPDATE"
    | "BULK_PRODUCT_IMPORT"
    | "STOCK_UPDATE"
    | "CATEGORY_CREATE"
    | "CATEGORY_UPDATE"
    | "CATEGORY_DELETE"
    | "COUPON_DELETE";

interface AuditLogData {
    action: AuditAction;
    adminId: string;
    adminEmail: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log admin action for audit trail
 */
export async function logAuditAction(data: AuditLogData): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: data.action,
                performedById: data.adminId, // mapped from adminId
                // adminEmail not stored in schema currently, maybe in details if needed
                entityType: data.targetType, // mapped from targetType
                entityId: data.targetId,     // mapped from targetId
                details: data.details,       // passed naturally as Json
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    } catch (error) {
        // Don't throw - audit logging should not break the main operation
        console.error("Failed to create audit log:", error);
    }
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(limit = 50) {
    return prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            action: true,
            performedBy: {
                select: { email: true }
            },
            entityType: true,
            entityId: true,
            createdAt: true,
            ipAddress: true,
        },
    });
}

/**
 * Get audit logs for a specific target
 */
export async function getAuditLogsForTarget(targetType: string, targetId: string) {
    return prisma.auditLog.findMany({
        where: {
            entityType: targetType,
            entityId: targetId,
        },
        orderBy: { createdAt: "desc" },
    });
}
