import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      subscriptionPlan: true,
      isAdmin: true,
      createdAt: true,
    },
  })

  return NextResponse.json(users)
}
