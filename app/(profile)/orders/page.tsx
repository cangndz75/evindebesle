'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Siparişlerim</h2>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş #123456</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Ürün: Kedi Maması 5kg</p>
          <p>Tarih: 12 Temmuz 2025</p>
          <p>Durum: Kargoya verildi</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş #789012</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Ürün: Köpek Tasmaları Seti</p>
          <p>Tarih: 2 Temmuz 2025</p>
          <p>Durum: Teslim edildi</p>
        </CardContent>
      </Card>
    </div>
  )
}
