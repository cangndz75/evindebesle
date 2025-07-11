import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const pets = await prisma.pet.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
    },
  })

  return NextResponse.json(pets)
}
