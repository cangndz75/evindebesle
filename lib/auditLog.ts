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
    | "COUPON_DELETE"
    | "PAYMENT_SUCCESS"
    | "SHIPMENT_LABEL_CREATED"
    | "CARGO_WEBHOOK_DELIVERED"
    | string;

interface AuditLogData {
    action: AuditAction;
    adminId: string;
    adminEmail: string;
    targetType?: string;
    targetId?: string;
    oldValue?: Record<string, any> | null;
    newValue?: Record<string, any> | null;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export async function logAuditAction(data: AuditLogData): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: data.action,
                performedById: data.adminId, // mapped from adminId
                entityType: data.targetType, // mapped from targetType
                entityId: data.targetId,     // mapped from targetId
                oldValue: data.oldValue ?? undefined,
                newValue: data.newValue ?? undefined,
                details: data.details,       // passed naturally as Json
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}

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

export async function getAuditLogsForTarget(targetType: string, targetId: string) {
    return prisma.auditLog.findMany({
        where: {
            entityType: targetType,
            entityId: targetId,
        },
        orderBy: { createdAt: "desc" },
    });
}
