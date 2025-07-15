import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const districts = await prisma.district.findMany({
    select: { id: true, name: true }
  });
  return NextResponse.json(districts);
}
