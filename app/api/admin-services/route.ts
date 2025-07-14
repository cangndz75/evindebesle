import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
    select: {
        id: true,
        name: true,
        description: true,
        price: true,
        isActive: true,
        image: true,
        createdAt: true, 
        },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Veri çekilemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const service = await prisma.service.create({
      data: {
        name: body.name,
        description: body.description || "",
        image: body.image || null,
        price: Number(body.price),
        isActive: true,
        createdAt: new Date(),
      },
    });
    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json({ error: "Hizmet oluşturulamadı" }, { status: 500 });
  }
}
