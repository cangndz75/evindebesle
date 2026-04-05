import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { logAuditAction } from "@/lib/auditLog";


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
    const { name, description, isActive, image, gender, group, showOnHome, showOnMen, showOnWomen } = body;

    const updateData: any = {};

    if (name !== undefined || gender !== undefined) {
      const targetName = name !== undefined ? name : (await prisma.category.findUnique({ where: { id } }))?.name || "";
      const targetGender = gender !== undefined ? gender : (await prisma.category.findUnique({ where: { id } }))?.gender || null;

      const { generateSlug } = await import("@/lib/slug");
      const baseSlug = generateSlug(targetName);

      let slugPrefix = "";
      if (targetGender === "MALE") slugPrefix = "men-";
      else if (targetGender === "FEMALE") slugPrefix = "women-";
      else if (targetGender === "UNISEX") slugPrefix = "unisex-";

      const slug = `${slugPrefix}${baseSlug}`;

      let finalSlug = slug;
      let counter = 1;
      const existing = await prisma.category.findUnique({ where: { id } });

      if (existing?.slug !== slug) {
        while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }
        updateData.slug = finalSlug;
      }

      if (name !== undefined) updateData.name = name;
      if (gender !== undefined) updateData.gender = gender || null;
    }

    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (image !== undefined) updateData.image = image || null;
    if (group !== undefined) updateData.group = group || "Giyim";
    if (showOnHome !== undefined) updateData.showOnHome = showOnHome;
    if (showOnMen !== undefined) updateData.showOnMen = showOnMen;
    if (showOnWomen !== undefined) updateData.showOnWomen = showOnWomen;

    const oldCategory = await prisma.category.findUnique({ where: { id } });

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    await logAuditAction({
      action: "CATEGORY_UPDATE",
      adminId: session.user.id,
      adminEmail: session.user.email || "",
      targetType: "Category",
      targetId: id,
      details: {
        oldValue: oldCategory,
        newValue: category,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });


    revalidatePath("/home");
    revalidatePath("/men");
    revalidatePath("/women");
    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { error: error.message || "Kategori güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

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

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: "Bu kategori kullanıldığı için silinemez" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({ where: { id } });

    await prisma.category.delete({
      where: { id },
    });

    await logAuditAction({
      action: "CATEGORY_DELETE",
      adminId: session.user.id,
      adminEmail: session.user.email || "",
      targetType: "Category",
      targetId: id,
      details: {
        deletedCategory: category,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });


    revalidatePath("/home");
    revalidatePath("/men");
    revalidatePath("/women");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Category deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Kategori silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
