import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const districts = await prisma.district.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(districts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "İlçe adı gerekli" }, { status: 400 });
  }

  const created = await prisma.district.create({
    data: {
      name,
      city: "İstanbul", 
    },
  });

  return NextResponse.json(created);
}
