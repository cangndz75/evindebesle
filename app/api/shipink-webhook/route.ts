import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const event = await request.json();
    // Shipink webhook örnek event yapısına göre güncelle
    const { order_id, tracking_code, status } = event;
    if (!order_id) {
      return NextResponse.json({ success: false, message: 'Eksik order_id' }, { status: 400 });
    }
    // Order tablosunda Shipink order_id ile eşleşen kaydı bul ve güncelle
    await prisma.order.updateMany({
      where: { orderNumber: order_id },
      data: {
        trackingNumber: tracking_code || undefined,
        status: status ? status.toUpperCase() : undefined,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
