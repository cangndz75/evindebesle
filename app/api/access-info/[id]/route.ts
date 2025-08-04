import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  keyLocation: z.string().optional(),
  keyInstruction: z.string().optional(),
  keyPhotoUrl: z.string().optional(),
  neighborName: z.string().optional(),
  neighborFlatNumber: z.string().optional(),
  doorPassword: z.string().optional(),
  doorNote: z.string().optional(),
  alarmExists: z.boolean().optional(),
  alarmPassword: z.string().optional(),
  alarmInstruction: z.string().optional(),
  alarmRoom: z.string().optional(),
  alarmTimeoutSeconds: z.coerce.number().optional(),
  notifySecurityGuard: z.boolean().optional(),
  callBeforeEnter: z.boolean().optional(),
  keyDropLocationAfterService: z.string().optional(),
  accessNote: z.string().optional(),
});

// ✅ PATCH: accessInfo'yu userId ile güncelle
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  try {
    const existing = await prisma.accessInfo.findFirst({
      where: { userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    const updated = await prisma.accessInfo.update({
      where: { id: existing.id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Kayıt güncellenemedi" }, { status: 500 });
  }
}

// ✅ DELETE: accessInfo'yu userId ile sil
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.accessInfo.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Silme işlemi başarısız" }, { status: 500 });
  }
}
