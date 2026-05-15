import "server-only";

import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { prisma } from "../db";
import { authConfig } from "../auth.config";

/**
 * @param req Route Handler isteği verildiğinde önce JWT cookie okunur (App Router'da getServerSession bazen boş döner).
 */
export async function getCurrentUser(req?: NextRequest) {
  let userId: string | null = null;

  if (req) {
    const token = await getToken({ req });
    userId = typeof token?.sub === "string" ? token.sub : null;
  }

  if (!userId) {
    const session = await getServerSession(authConfig);
    userId = typeof session?.user?.id === "string" ? session.user.id : null;
  }

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
    },
  });
}
