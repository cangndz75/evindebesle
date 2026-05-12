import "server-only";

import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit, RateLimits } from "./rateLimit";
import { logAuditAction } from "@/lib/auditLog";

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const cleaned = raw?.trim();
  return cleaned || null;
}

function extractForwardedFor(forwarded: string | null): string | null {
  if (!forwarded) return null;
  const first = forwarded.split(",")[0]?.trim();
  if (!first) return null;

  const forMatch = first.match(/for=(?:"?)(\[[^\]]+\]|[^;,"]+)(?:"?)/i);
  if (forMatch?.[1]) {
    return forMatch[1].replace(/^\[|\]$/g, "").trim();
  }

  return first.replace(/^\[|\]$/g, "").trim();
}

function resolveClientIp(headers: Record<string, string | string[] | undefined>): string {
  const cfConnectingIp = firstHeaderValue(headers["cf-connecting-ip"]);
  if (cfConnectingIp) return cfConnectingIp;

  const xRealIp = firstHeaderValue(headers["x-real-ip"]);
  if (xRealIp) return xRealIp;

  const xForwardedFor = extractForwardedFor(firstHeaderValue(headers["x-forwarded-for"]));
  if (xForwardedFor) return xForwardedFor;

  const xVercelForwardedFor = extractForwardedFor(firstHeaderValue(headers["x-vercel-forwarded-for"]));
  if (xVercelForwardedFor) return xVercelForwardedFor;

  const forwarded = extractForwardedFor(firstHeaderValue(headers.forwarded));
  if (forwarded) return forwarded;

  const trueClientIp = firstHeaderValue(headers["true-client-ip"]);
  if (trueClientIp) return trueClientIp;

  const xClientIp = firstHeaderValue(headers["x-client-ip"]);
  if (xClientIp) return xClientIp;

  return "127.0.0.1";
}


export const authConfig: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const clientIp = resolveClientIp(req.headers || {});

        if (!credentials?.email || !credentials?.password) return null;


        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        if (user.isAdmin) {
          const ipAddress = clientIp;
          const userAgentHeader = req.headers?.["user-agent"];
          const userAgent = Array.isArray(userAgentHeader)
            ? userAgentHeader[0]
            : userAgentHeader;

          await logAuditAction({
            action: "ADMIN_LOGIN_SUCCESS",
            adminId: user.id,
            adminEmail: user.email,
            targetType: "AUTH",
            targetId: user.id,
            details: {
              event: "ADMIN_LOGIN",
              status: "SUCCESS",
            },
            ipAddress,
            userAgent,
          });
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          adminMfaEnabled: Boolean(user.adminMfaEnabled),
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
        session.user.adminMfaEnabled = false;
        session.user.districtId = null;
        session.user.fullAddress = null;
        session.user.isTestUser = false;
        return session;
      }

      session.user.id = token.sub;
      session.user.email = token.email ?? session.user.email;
      session.user.name = token.name ?? session.user.name;
      session.user.isAdmin = Boolean(token.isAdmin);
      session.user.adminMfaEnabled = Boolean(token.adminMfaEnabled);
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
        token.adminMfaEnabled = Boolean(user.adminMfaEnabled);
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
            adminMfaEnabled: true,
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
          delete token.adminMfaEnabled;
          delete token.districtId;
          delete token.fullAddress;
          delete token.isTestUser;
          return token;
        }

        token.sub = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.isAdmin = Boolean(dbUser.isAdmin);
        token.adminMfaEnabled = Boolean(dbUser.adminMfaEnabled);
        token.districtId = dbUser.districtId;
        token.fullAddress = dbUser.fullAddress;
        token.isTestUser = dbUser.isTestUser ?? false;
      } catch {
        delete token.sub;
        delete token.email;
        delete token.name;
        delete token.isAdmin;
        delete token.adminMfaEnabled;
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
