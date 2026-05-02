const COMPLETION_ALLOWED_STATUSES = new Set(["SHIPPED", "DELIVERED"]);

export function canTransitionToCompletedFrom(currentStatus: string | null | undefined): boolean {
  if (!currentStatus) return false;
  return COMPLETION_ALLOWED_STATUSES.has(String(currentStatus).toUpperCase());
}
