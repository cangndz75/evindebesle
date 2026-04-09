import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { tracking_number, status } = await req.json();
    if (!tracking_number || status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Geçersiz payload' }, { status: 400 });
    }

    const order = await prisma.order.updateMany({
      where: { trackingNumber: tracking_number },
      data: { status: 'COMPLETED' },
    });

    if (order.count === 0) {
      console.error('Sipariş bulunamadı:', tracking_number);
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
