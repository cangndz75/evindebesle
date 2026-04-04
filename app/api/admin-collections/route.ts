import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {

    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true } }
      }
    });

    return jsonNoStore(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { title, slug, description, image1, image2, image3, isActive } = await request.json();

    if (!title || !slug) {
      return jsonNoStore({ error: "Title ve Slug zorunludur" }, { status: 400 });
    }

    const existing = await prisma.collection.findUnique({ where: { slug } });
    if (existing) {
       return jsonNoStore({ error: "Bu slug (URL adresi) zaten kullanılıyor" }, { status: 400 });
    }

    const count = await prisma.collection.count();

    const collection = await prisma.collection.create({
      data: {
        title,
        slug,
        description,
        image1,
        image2,
        image3,
        isActive: isActive !== undefined ? isActive : true,
        order: count
      }
    });

    revalidatePath("/collections");
    return jsonNoStore(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id, title, slug, description, image1, image2, image3, isActive } = await request.json();

    if (!id || !title || !slug) {
      return jsonNoStore({ error: "Eksik parametreler" }, { status: 400 });
    }

    const existing = await prisma.collection.findFirst({ where: { slug, id: { not: id } } });
    if (existing) {
       return jsonNoStore({ error: "Bu slug (URL adresi) başka bir koleksiyonda kullanılıyor" }, { status: 400 });
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        image1,
        image2,
        image3,
        isActive
      }
    });

    revalidatePath("/collections");
    return jsonNoStore(collection);
  } catch (error) {
    console.error("Error updating collection:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonNoStore({ error: "ID gerekli" }, { status: 400 });
    }

    await prisma.collection.delete({
      where: { id }
    });

    revalidatePath("/collections");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return jsonNoStore({ error: "Server error" }, { status: 500 });
  }
}
