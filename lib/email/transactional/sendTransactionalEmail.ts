import "server-only";

import { resend, resendFromAddress } from "@/lib/resend";
import type { TransactionalEmailInput } from "./types";
import { renderTransactionalEmail } from "./renderTransactionalEmail";

type SendParams = {
  to: string;
  /** Varsayılan: RESEND_FROM / resendFromAddress() */
  from?: string;
  replyTo?: string;
} & TransactionalEmailInput;

/**
 * Şablonu render edip Resend ile gönderir.
 */
export async function sendTransactionalEmail(params: SendParams) {
  const { to, from, replyTo, ...emailInput } = params;
  const { subject, html } = await renderTransactionalEmail(emailInput);

  return resend.emails.send({
    from: from ?? resendFromAddress(),
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}
