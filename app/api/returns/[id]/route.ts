import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (body?.action !== "cancel") {
      return new NextResponse("Invalid action", { status: 400 });
    }

    const current = await prisma.returnRequest.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!current) {
      return new NextResponse("Return request not found", { status: 404 });
    }

    if (current.status !== "PENDING") {
      return new NextResponse("Only pending return requests can be cancelled", { status: 400 });
    }

    const updated = await prisma.returnRequest.update({
      where: { id: current.id },
      data: {
        status: "REJECTED",
        adminNote: "Müşteri tarafından iptal edildi.",
      },
      include: {
        order: {
          select: {
            orderNumber: true,
          },
        },
        items: {
          include: {
            orderItem: {
              select: {
                productName: true,
                colorName: true,
                sizeName: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[RETURNS_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
