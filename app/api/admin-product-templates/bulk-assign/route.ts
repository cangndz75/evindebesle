import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isTestUser)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type, templateId, productIds, categoryIds, assignMode, applyToAllProducts } = body;

    if (!type || !templateId) {
      return NextResponse.json({ error: "Eksik veya hatalı parametre" }, { status: 400 });
    }

    const resolvedAssignMode = assignMode || (applyToAllProducts ? "ALL" : "PRODUCTS");

    if (resolvedAssignMode === "PRODUCTS" && (!Array.isArray(productIds) || productIds.length === 0)) {
      return NextResponse.json({ error: "Ürün seçimi gerekli" }, { status: 400 });
    }

    if (resolvedAssignMode === "CATEGORIES" && (!Array.isArray(categoryIds) || categoryIds.length === 0)) {
      return NextResponse.json({ error: "Kategori seçimi gerekli" }, { status: 400 });
    }

    if (!["PRODUCTS", "CATEGORIES", "ALL"].includes(resolvedAssignMode)) {
      return NextResponse.json({ error: "Geçersiz atama modu" }, { status: 400 });
    }

    const whereClause =
      resolvedAssignMode === "ALL"
        ? {}
        : resolvedAssignMode === "CATEGORIES"
          ? { categoryId: { in: categoryIds } }
          : { id: { in: productIds } };

    let result: any = null;
    if (type === "WASHING") {
      result = await prisma.product.updateMany({
        where: whereClause,
        data: { washingInstructionId: templateId },
      });
    } else if (type === "DELIVERY") {
      result = await prisma.product.updateMany({
        where: whereClause,
        data: { deliveryInfoId: templateId },
      });
    } else if (type === "SIZENOTE") {
      result = await prisma.product.updateMany({
        where: whereClause,
        data: { sizeNoteId: templateId },
      });
    } else {
      return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
    }

    revalidatePath("/home");
    revalidatePath("/men");
    revalidatePath("/women");
    
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("[TEMPLATES_BULK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
