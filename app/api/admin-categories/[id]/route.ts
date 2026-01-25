import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

// GET: Kategori detayını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true, // Deprecated ama çalışıyor
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Category fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Kategori getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// PATCH: Kategoriyi güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
      // Slug'ı da güncelle
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
      const existing = await prisma.category.findUnique({ where: { id } });
      if (existing?.slug !== slug) {
        while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }
      } else if (existing) {
        finalSlug = existing.slug;
      }
      updateData.slug = finalSlug;
    }

    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { error: error.message || "Kategori güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE: Kategoriyi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Kategoriyi kullanan ürün var mı kontrol et
    const productCount = await prisma.productCategory.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: "Bu kategori kullanıldığı için silinemez" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Category deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Kategori silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
