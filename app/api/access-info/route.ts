import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

function getAppointmentIdFromUrl(req: NextRequest) {
  const url = new URL(req.url);
  return url.searchParams.get("appointmentId");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const appointmentId = getAppointmentIdFromUrl(req);

  const accessInfo = await prisma.accessInfo.findFirst({
    where: {
      id: session.user.id,
      ...(appointmentId ? { appointmentId } : {}),
    },
  });

  return NextResponse.json(accessInfo || null);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const data = await req.json();

  const created = await prisma.accessInfo.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  });

  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const data = await req.json();

  const existing = await prisma.accessInfo.findFirst({
    where: {
      id: session.user.id,
      appointmentId: data.appointmentId || null,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Erişim bilgisi bulunamadı" }, { status: 404 });
  }

  const updated = await prisma.accessInfo.update({
    where: { id: existing.id },
    data: { ...data },
  });

  return NextResponse.json(updated);
}
