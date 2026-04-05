import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { logAuditAction } from "@/lib/auditLog";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isActive, image, gender, group, showOnHome, showOnMen, showOnWomen } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Kategori adı gereklidir" },
        { status: 400 }
      );
    }

    const { generateSlug } = await import("@/lib/slug");
    const baseSlug = generateSlug(name);

    let slugPrefix = "";
    if (gender === "MALE") slugPrefix = "men-";
    else if (gender === "FEMALE") slugPrefix = "women-";
    else if (gender === "UNISEX") slugPrefix = "unisex-";

    const slug = `${slugPrefix}${baseSlug}`;

    let finalSlug = slug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const maxSortOrder = await prisma.category.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        image: image || null,
        gender: gender || null,
        group: group || "Giyim",
        showOnHome: showOnHome !== undefined ? showOnHome : false,
        showOnMen: showOnMen !== undefined ? showOnMen : false,
        showOnWomen: showOnWomen !== undefined ? showOnWomen : false,
        sortOrder: nextSortOrder,
      },
    });

    await logAuditAction({
      action: "CATEGORY_CREATE",
      adminId: session.user.id,
      adminEmail: session.user.email || "",
      targetType: "Category",
      targetId: category.id,
      details: {
        name: category.name,
        slug: category.slug,
      },
      ipAddress: (req as any).headers?.get("x-forwarded-for") || undefined,
      userAgent: (req as any).headers?.get("user-agent") || undefined,
    });

    revalidatePath("/home");
    revalidatePath("/men");
    revalidatePath("/women");
    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Category creation error:", error);
    return NextResponse.json(
      { error: error.message || "Kategori oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
