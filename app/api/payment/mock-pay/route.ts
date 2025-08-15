import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { draftAppointmentId, amount } = body;

  if (!draftAppointmentId || !amount) {
    return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Mock ödeme başarılı",
    draftAppointmentId,
    transactionId: `MOCK-${Date.now()}`,
  });
}
