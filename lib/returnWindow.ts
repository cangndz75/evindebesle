const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_RETURN_WINDOW_DAYS = 14;

/** Sunucu: RETURN_WINDOW_DAYS; istemci: NEXT_PUBLIC_RETURN_WINDOW_DAYS (yoksa 14). */
export function getReturnWindowDays(): number {
    const raw =
        process.env.RETURN_WINDOW_DAYS ??
        process.env.NEXT_PUBLIC_RETURN_WINDOW_DAYS ??
        "";
    const n = parseInt(String(raw).trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_RETURN_WINDOW_DAYS;
}

function coerceDate(value: unknown): Date | null {
    if (value == null) return null;
    const d = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(d.getTime()) ? null : d;
}

export type ReturnWindowOrderDates = {
    deliveredAt?: unknown;
    shippedAt?: unknown;
    paidAt?: unknown;
};

/**
 * İade süresi başlangıcı: önce teslim, yoksa kargoya verilme, yoksa ödeme.
 * Hepsi boşsa null (çağıran taraf pencere kontrolünü atlayabilir).
 */
export function getReturnReferenceDate(dates: ReturnWindowOrderDates): Date | null {
    return (
        coerceDate(dates.deliveredAt) ||
        coerceDate(dates.shippedAt) ||
        coerceDate(dates.paidAt) ||
        null
    );
}

/** Referans anından itibaren RETURN_WINDOW_DAYS * 24 saat içinde miyiz? */
export function isReturnWindowOpen(referenceDate: Date): boolean {
    const deadline = referenceDate.getTime() + getReturnWindowDays() * MS_PER_DAY;
    return Date.now() <= deadline;
}

/** Tarihler bilinmiyorsa true döner (eski kayıtları kilitlememek için). */
export function isOrderReturnWindowOpen(dates: ReturnWindowOrderDates): boolean {
    const ref = getReturnReferenceDate(dates);
    if (!ref) return true;
    return isReturnWindowOpen(ref);
}
