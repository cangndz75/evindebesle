import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
      },
    });

    return NextResponse.json(collections, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Public collections fetch error:", error);
    return NextResponse.json(
      { error: "Koleksiyonlar yuklenemedi" },
      { status: 500 }
    );
  }
}
