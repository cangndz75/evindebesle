import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { z } from "zod";

// PATCH için veri doğrulama şeması
const updatePetSchema = z.object({
  name: z.string().optional(),
  age: z.number().int().min(0).optional(),
  gender: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  allergy: z.string().optional(),
  sensitivity: z.string().nullable().optional(),
  specialNote: z.string().nullable().optional(),
  relation: z.string().nullable().optional(),
  allowAdUse: z.boolean().optional(),
});

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.warn("❌ Yetkisiz istek: Kullanıcı oturumu bulunamadı");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📥 DELETE /api/user-pets/[id] isteği:", { id, userId: session.user.id });

    const deleted = await prisma.ownedPet.deleteMany({
      where: { id, userId: session.user.id },
    });

    if (deleted.count === 0) {
      console.warn("⚠️ OwnedPet bulunamadı veya yetkisiz:", { id });
      return NextResponse.json(
        { error: "Evcil hayvan bulunamadı veya silme yetkiniz yok" },
        { status: 404 }
      );
    }

    console.log("✅ OwnedPet silindi:", { id });

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("❌ DELETE /api/user-pets/[id] hatası:", error);
    return NextResponse.json(
      { error: "Evcil hayvan silinemedi" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.warn("❌ Yetkisiz istek: Kullanıcı oturumu bulunamadı");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 PATCH /api/user-pets/[id] gelen veri:", { id, body });

    // Veri doğrulama
    const parsedBody = updatePetSchema.safeParse(body);
    if (!parsedBody.success) {
      console.warn("⚠️ Geçersiz veri:", parsedBody.error);
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsedBody.error },
        { status: 400 }
      );
    }

    // OwnedPet'in varlığını ve kullanıcıya ait olduğunu kontrol et
    const existingPet = await prisma.ownedPet.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existingPet) {
      console.warn("⚠️ OwnedPet bulunamadı veya yetkisiz:", { id });
      return NextResponse.json(
        { error: "Evcil hayvan bulunamadı veya güncelleme yetkiniz yok" },
        { status: 404 }
      );
    }

    const updated = await prisma.ownedPet.update({
      where: { id, userId: session.user.id },
      data: {
        name: parsedBody.data.name,
        age: parsedBody.data.age,
        gender: parsedBody.data.gender,
        image: parsedBody.data.image || null,
        allergy: parsedBody.data.allergy
          ? parsedBody.data.allergy.split(",").map((s: string) => s.trim())
          : [],
        sensitivity: parsedBody.data.sensitivity || null,
        specialNote: parsedBody.data.specialNote || null,
        relation: parsedBody.data.relation || null,
        allowAdUse: parsedBody.data.allowAdUse ?? false,
      },
    });

    console.log("✅ OwnedPet güncellendi:", updated.id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ PATCH /api/user-pets/[id] hatası:", error);
    return NextResponse.json(
      { error: "Evcil hayvan güncellenemedi" },
      { status: 500 }
    );
  }
}