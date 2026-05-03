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
      if (!token?.sub) {
        session.user.id = undefined;
        session.user.email = null;
        session.user.name = null;
        session.user.isAdmin = false;
        session.user.districtId = null;
        session.user.fullAddress = null;
        session.user.isTestUser = false;
        return session;
      }

      session.user.id = token.sub;
      session.user.email = token.email ?? session.user.email;
      session.user.name = token.name ?? session.user.name;
      session.user.isAdmin = Boolean(token.isAdmin);
      session.user.districtId = token.districtId;
      session.user.fullAddress = token.fullAddress;
      session.user.isTestUser = Boolean(token.isTestUser);
      return session;
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        const id = typeof user.id === "string" ? user.id : String(user.id);
        token.sub = id;
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.isAdmin = Boolean(user.isAdmin);
        token.districtId = user.districtId ?? null;
        token.fullAddress = user.fullAddress ?? null;
        token.isTestUser = user.isTestUser ?? false;
        return token;
      }

      const userId = token.sub as string | undefined;
      if (!userId) return token;

      try {
        const dbUser = await prisma.user.findFirst({
          where: { id: userId, deletedAt: null },
          select: {
            id: true,
            email: true,
            name: true,
            isAdmin: true,
            districtId: true,
            fullAddress: true,
            isTestUser: true,
          },
        });

        if (!dbUser) {
          delete token.sub;
          delete token.email;
          delete token.name;
          delete token.isAdmin;
          delete token.districtId;
          delete token.fullAddress;
          delete token.isTestUser;
          return token;
        }

        token.sub = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.isAdmin = Boolean(dbUser.isAdmin);
        token.districtId = dbUser.districtId;
        token.fullAddress = dbUser.fullAddress;
        token.isTestUser = dbUser.isTestUser ?? false;
      } catch {
        delete token.sub;
        delete token.email;
        delete token.name;
        delete token.isAdmin;
        delete token.districtId;
        delete token.fullAddress;
        delete token.isTestUser;
      }

      return token;
    },
  },
  pages: {
    signIn: "/auth-tabs",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};
