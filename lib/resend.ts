import { Resend } from "resend";
import { env } from "./env";

export const resend = new Resend(env.RESEND_API_KEY);

export function resendFromAddress(): string {
  return process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
}