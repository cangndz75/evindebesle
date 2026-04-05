import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { jsonNoStore } from "@/lib/api/policy";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
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
      where: { id: session.user.id },
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
      where: { userId: session.user.id, isPrimary: true },
      select: { id: true, districtId: true, fullAddress: true },
    }),
  ]);

  return jsonNoStore({
    user,
    primaryAddress: primaryAddress ?? null,
  });
}
