import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Kategoriler yüklenirken hata:", error);
    return NextResponse.json(
      { error: "Kategoriler yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Kategori adı gerekli" }, { status: 400 });
    }

    const { generateSlug } = await import("@/lib/slug");
    const slug = generateSlug(name);

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || undefined,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Kategori oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Kategori oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
