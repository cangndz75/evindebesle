import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const services = await prisma.service.findMany({
    select: { id: true, name: true, description: true, price: true, isActive: true },
  })

  return NextResponse.json(services)
}
