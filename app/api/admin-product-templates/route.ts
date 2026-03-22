import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isTestUser)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "WASHING", "DELIVERY", "SIZENOTE"

    let data: any[] = [];
    if (type === "WASHING") {
      data = await prisma.washingInstruction.findMany({ orderBy: { createdAt: "desc" } });
    } else if (type === "DELIVERY") {
      data = await prisma.deliveryInfo.findMany({ orderBy: { createdAt: "desc" } });
    } else if (type === "SIZENOTE") {
      data = await prisma.sizeNote.findMany({ orderBy: { createdAt: "desc" } });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TEMPLATES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isTestUser)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type, title, content } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    let created: any = null;
    if (type === "WASHING") {
      created = await prisma.washingInstruction.create({ data: { title, content } });
    } else if (type === "DELIVERY") {
      created = await prisma.deliveryInfo.create({ data: { title, content } });
    } else if (type === "SIZENOTE") {
      created = await prisma.sizeNote.create({ data: { title, content } });
    } else {
      return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
    }

    return NextResponse.json(created);
  } catch (error) {
    console.error("[TEMPLATES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.isAdmin && !user.isTestUser)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    if (type === "WASHING") {
      await prisma.washingInstruction.delete({ where: { id } });
    } else if (type === "DELIVERY") {
      await prisma.deliveryInfo.delete({ where: { id } });
    } else if (type === "SIZENOTE") {
      await prisma.sizeNote.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEMPLATES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
