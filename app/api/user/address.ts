import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const body = await req.json();
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      districtId: body.districtId,
      fullAddress: body.fullAddress,
    },
  });
  return NextResponse.json({ success: true });
}
