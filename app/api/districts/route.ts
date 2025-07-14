import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const districts = await prisma.district.findMany({
    orderBy: { name: "asc" }
  })
  return NextResponse.json(districts)
}
