import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";
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

  await prisma.userAddress.updateMany({
    where: { userId: session.user.id },
    data: { isPrimary: false },
  });

  const updated = await prisma.userAddress.update({
    where: { id },
    data: { isPrimary: true },
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
