import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isTestUser)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { productId, relatedProductId } = await req.json();

    if (!productId || !relatedProductId) {
      return NextResponse.json(
        { error: "Product ID and Related Product ID are required" },
        { status: 400 }
      );
    }

    if (productId === relatedProductId) {
      return NextResponse.json(
        { error: "Cannot combine a product with itself" },
        { status: 400 }
      );
    }

    const existing = await prisma.productCombination.findUnique({
      where: {
        productId_relatedProductId: {
          productId,
          relatedProductId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This combination already exists" },
        { status: 400 }
      );
    }

    const combo = await prisma.productCombination.create({
      data: {
        productId,
        relatedProductId,
      },
      include: {
        relatedProduct: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
            stockCode: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(combo);
  } catch (error) {
    console.error("[PRODUCT_COMBINATIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isTestUser)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    const relatedProductId = url.searchParams.get("relatedProductId");

    if (!productId || !relatedProductId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    await prisma.productCombination.delete({
      where: {
        productId_relatedProductId: {
          productId,
          relatedProductId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PRODUCT_COMBINATIONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isTestUser)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const combinations = await prisma.productCombination.findMany({
      where: { productId },
      include: {
        relatedProduct: {
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
            stockCode: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(combinations);
  } catch (error) {
    console.error("[PRODUCT_COMBINATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
