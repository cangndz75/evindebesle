import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true } }
      }
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, slug, description, image1, image2, image3, isActive } = await request.json();

    if (!title || !slug) {
      return NextResponse.json({ error: "Title ve Slug zorunludur" }, { status: 400 });
    }

    const existing = await prisma.collection.findUnique({ where: { slug } });
    if (existing) {
       return NextResponse.json({ error: "Bu slug (URL adresi) zaten kullanılıyor" }, { status: 400 });
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

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, slug, description, image1, image2, image3, isActive } = await request.json();

    if (!id || !title || !slug) {
      return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
    }

    const existing = await prisma.collection.findFirst({ where: { slug, id: { not: id } } });
    if (existing) {
       return NextResponse.json({ error: "Bu slug (URL adresi) başka bir koleksiyonda kullanılıyor" }, { status: 400 });
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

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    await prisma.collection.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
