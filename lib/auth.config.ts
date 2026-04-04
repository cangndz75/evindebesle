import "server-only";

import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit, RateLimits } from "./rateLimit";


export const authConfig: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Rate Limiting
        const ip = req.headers?.["x-forwarded-for"] || "127.0.0.1";
        const ratelimit = await checkRateLimit(ip as string, RateLimits.strict);

        if (!ratelimit.success) {
          throw new Error("Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyiniz.");
        }

        if (!credentials?.email || !credentials?.password) return null;


        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          districtId: user.districtId,
          fullAddress: user.fullAddress,
          isTestUser: user.isTestUser ?? false,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
  },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.sub;
        session.user.isAdmin = token.isAdmin;
        session.user.districtId = token.districtId;
        session.user.fullAddress = token.fullAddress;
        session.user.isTestUser = Boolean(token.isTestUser);
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.sub = user.id;
        token.isAdmin = user.isAdmin;
        token.districtId = user.districtId;
        token.fullAddress = user.fullAddress;
        token.isTestUser = user.isTestUser ?? false;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};
