import { NextResponse } from 'next/server';
import { shipinkClient } from '@/lib/shipink';

export async function GET() {
  try {
    // 1. Depoları Çek
    const warehousesResponse = await shipinkClient.fetchWithAuth('/warehouses?limit=10');
    // 2. Kargo Hesaplarını Çek
    const carriersResponse = await shipinkClient.fetchWithAuth('/carrier-accounts?limit=10');
    // Ekrana bas
    return NextResponse.json({
      mesaj: 'İşte kopyalaman gereken ID\'ler 👇',
      DEPOLAR: warehousesResponse.data,
      KARGO_HESAPLARI: carriersResponse.data
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
