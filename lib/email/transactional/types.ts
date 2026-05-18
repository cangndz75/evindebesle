/** Merkezi transaksiyonel e-posta girişleri — yeni türler buraya eklenir. */

export type ReturnRequestCreatedPayload = {
  orderNumber: string;
  carrierName: string;
  trackingCode: string | null;
  pdfUrl: string | null;
  trackingUrl: string | null;
};

export type AbandonedCheckoutReminderPayload = {
  checkoutUrl: string;
  couponCode: string;
  /** Sipariş özetinde gösterim için (opsiyonel) */
  orderIdShort?: string;
};

export type TransactionalEmailInput =
  | { type: "RETURN_REQUEST_CREATED"; payload: ReturnRequestCreatedPayload }
  | { type: "ABANDONED_CHECKOUT_REMINDER"; payload: AbandonedCheckoutReminderPayload };

export type RenderedTransactionalEmail = {
  subject: string;
  html: string;
};
