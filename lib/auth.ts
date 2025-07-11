import {betterAuth} from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP } from "better-auth/plugins";
import { resend } from "./resend";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider:"postgresql",
  }),
  socialProviders: {
    google:{
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
    }
  },
  plugins: [
  emailOTP({
    async sendVerificationOTP({ email, otp }) {
      console.log("[OTP GÖNDERİLİYOR]", email, otp);

      const { data, error } = await resend.emails.send({
        from: "Evinde Besle <onboarding@resend.dev>",
        to: [email],
        subject: "Evinde Besle - OTP Doğrulama",
        html: `<p>Evinde Besle OTP doğrulama kodunuz: <strong>${otp}</strong></p><p>Bu kodu kimseyle paylaşmayın.</p>`,
      });

      console.log("[OTP SEND DATA]", data); 
      console.log("[OTP SEND ERROR]", error); 
    }
  })
  ]
});