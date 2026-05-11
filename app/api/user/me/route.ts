import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { jsonNoStore } from "@/lib/api/policy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    const userId = typeof token?.sub === "string" ? token.sub : null;

    if (!userId) {
      return jsonNoStore(
        {
          error: "Unauthenticated",
          user: null,
          primaryAddress: null,
        },
        { status: 401 }
      );
    }

    const [user, primaryAddress] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          marketingEmailConsent: true,
          isTestUser: true,
          isAdmin: true,
        },
      }),
      prisma.userAddress.findFirst({
        where: { userId, isPrimary: true },
        select: { id: true, districtId: true, fullAddress: true },
      }),
    ]);

    if (!user) {
      return jsonNoStore(
        {
          error: "Unauthenticated",
          user: null,
          primaryAddress: null,
        },
        { status: 401 }
      );
    }

    return jsonNoStore({
      user,
      primaryAddress: primaryAddress ?? null,
    });
  } catch (error) {
    console.error("[API][user/me] session error", error);
    return jsonNoStore(
      {
        error: "Unauthenticated",
        user: null,
        primaryAddress: null,
      },
      { status: 401 }
    );
  }
}
