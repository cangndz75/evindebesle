// // app/api/appointments/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { prisma } from "@/lib/db";

// export async function POST(req: NextRequest) {
//   const session = await getServerSession(authConfig);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const body = await req.json();

//   try {
//     const appointment = await prisma.appointment.create({
//       data: {
//         userId: session.user.id,
//         userNote: body.userNote,
//         allergy: body.allergy,
//         sensitivity: body.sensitivity,
//         specialRequest: body.specialRequest,
//         districtId: body.districtId,
//         fullAddress: body.fullAddress,
//         timeSlot: body.timeSlot,
//         repeatCount: body.repeatCount,
//         repeatInterval: body.repeatInterval,
//         userPetId: body.userPetId,
//         status: "SCHEDULED",
//         finalPrice: body.finalPrice ?? 0,
//         couponId: body.couponId ?? null,
//       },
//     });

//     return NextResponse.json(appointment);
//   } catch (error) {
//     console.error("Appointment POST error", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Appointments API aktif" });
}
