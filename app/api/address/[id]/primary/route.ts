import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  const existingAddress = await prisma.userAddress.findUnique({
    where: { id },
    select: { id: true, userId: true, districtId: true, fullAddress: true },
  });

  if (!existingAddress || existingAddress.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden: You do not own this address" },
      { status: 403 }
    );
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.userAddress.updateMany({
      where: { userId: session.user.id, isPrimary: true },
      data: { isPrimary: false },
    });

    return tx.userAddress.update({
      where: { id, userId: session.user.id },
      data: { isPrimary: true },
    });
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      districtId: updated.districtId,
      fullAddress: updated.fullAddress,
    },
  });

  return NextResponse.json({ success: true });
}
