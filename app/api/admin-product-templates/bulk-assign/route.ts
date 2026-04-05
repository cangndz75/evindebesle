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
    const { type, templateId, productIds } = body;

    if (!type || !templateId || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: "Eksik veya hatalÄ± parametre" }, { status: 400 });
    }

    let result: any = null;
    if (type === "WASHING") {
      result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { washingInstructionId: templateId },
      });
    } else if (type === "DELIVERY") {
      result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { deliveryInfoId: templateId },
      });
    } else if (type === "SIZENOTE") {
      result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { sizeNoteId: templateId },
      });
    } else {
      return NextResponse.json({ error: "GeÃ§ersiz tip" }, { status: 400 });
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
