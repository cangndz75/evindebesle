import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

// GET: Tüm kategorileri getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            products: true, // Deprecated ama çalışıyor
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Kategoriler getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// POST: Yeni kategori oluştur
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Kategori adı gereklidir" },
        { status: 400 }
      );
    }

    // Slug oluştur
    const slug = name
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Slug unique kontrolü
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Category creation error:", error);
    return NextResponse.json(
      { error: error.message || "Kategori oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
