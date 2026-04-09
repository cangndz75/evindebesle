import { Resend } from "resend";
import { env } from "./env";

export const resend = new Resend(env.RESEND_API_KEY);

/** Resend panelinde doğrulanmış gönderici; yoksa şifre sıfırlama / OTP ile aynı varsayılan. */
export function resendFromAddress(): string {
  return (
    process.env.RESEND_FROM?.trim() ||
    "Dark Velvet <noreply@dark-velvet.com>"
  );
}