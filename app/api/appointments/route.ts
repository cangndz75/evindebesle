import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    const user = session?.user

    if (!user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
    }

    const {
      petIds,
      serviceIds,
      districtId,
      fullAddress,
      dates,
      isRecurring,
      recurringType,
      recurringCount,
      timeSlot,
      userNote,
    } = await req.json()

    if (!petIds?.length || !Array.isArray(dates) || dates.length === 0 || !timeSlot) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 })
    }

    let userAddressId: string | null = null

    if (districtId && fullAddress) {
      const addr = await prisma.userAddress.create({
        data: {
          userId: user.id,
          districtId,
          fullAddress,
        },
      })
      userAddressId = addr.id
    }

    const appointments = []

    for (const petId of petIds) {
      const isUserPet = await prisma.ownedPet.findFirst({
        where: {
          id: petId,
          userId: user.id,
        },
      })

      if (!isUserPet) {
        console.warn("Kullanıcıya ait olmayan petId:", petId)
        continue
      }

      for (const date of dates) {
        const appointment = await prisma.appointment.create({
          data: {
            userId: user.id,
            ownedPetId: petId,
            confirmedAt: new Date(date),
            status: "SCHEDULED",
            isRecurring: isRecurring || false,
            repeatCount: isRecurring ? recurringCount : null,
            repeatInterval: isRecurring ? recurringType : null,
            timeSlot,
            userNote: userNote || null,
            userAddressId,
            services: {
              create: serviceIds.map((serviceId: string) => ({
                serviceId,
              })),
            },
          },
        })
        appointments.push(appointment)
      }
    }

    return NextResponse.json({ success: true, appointments })
  } catch (error) {
    console.error("Randevu oluşturma hatası:", error)
    return NextResponse.json(
      { success: false, message: "Bir hata oluştu." },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authConfig)
    const user = session?.user

    if (!user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: { confirmedAt: "desc" },
      include: {
        ownedPet: {
          include: { pet: true },
        },
        services: {
          include: { service: true },
        },
        address: {
          include: { district: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: appointments })
  } catch (error) {
    console.error("Randevular getirme hatası:", error)
    return NextResponse.json(
      { success: false, message: "Randevular alınamadı." },
      { status: 500 }
    )
  }
}
