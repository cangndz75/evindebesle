"use client";
import { useRouter } from "next/navigation";

const orders = [
  {
    id: "1775697127336",
    date: "09 Nis 2026, 07:12",
    customer: "Can Test2",
    email: "cangunduz01@gmail.com",
    total: 119.9,
    payment: "Ödendi",
    fulfillment: "Hazırlanıyor",
    products: "2 ürün — Erkek Termal İçlik Tek Alt",
  },
  {
    id: "1775612484821",
    date: "08 Nis 2026, 21:45",
    customer: "Ayşe Kaya",
    email: "ayse.kaya@gmail.com",
    total: 549.0,
    payment: "Ödendi",
    fulfillment: "Kargoda",
    products: "2 ürün — Kadın Kışlık Mont, Bere",
  },
  // ... diğer siparişler ...
];

export default function OrdersPage() {
  const router = useRouter();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Siparişler</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm">
              <th className="py-2 px-4 text-left">SİPARİŞ NO</th>
              <th className="py-2 px-4 text-left">TARİH</th>
              <th className="py-2 px-4 text-left">MÜŞTERİ</th>
              <th className="py-2 px-4 text-left">TUTAR</th>
              <th className="py-2 px-4 text-left">ÖDEME</th>
              <th className="py-2 px-4 text-left">FULFILLMENT</th>
              <th className="py-2 px-4 text-left">ÜRÜNLER</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 cursor-pointer border-b"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <td className="py-2 px-4 font-mono text-xs">#DV-{order.id}</td>
                <td className="py-2 px-4">{order.date}</td>
                <td className="py-2 px-4">
                  <div className="font-medium">{order.customer}</div>
                  <div className="text-xs text-gray-500">{order.email}</div>
                </td>
                <td className="py-2 px-4 font-semibold">₺{order.total.toLocaleString("tr-TR", {minimumFractionDigits:2})}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${order.payment === "Ödendi" ? "bg-green-100 text-green-700" : order.payment === "Ödeme Bekleniyor" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>{order.payment}</span>
                </td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${order.fulfillment === "Hazırlanıyor" ? "bg-orange-100 text-orange-700" : order.fulfillment === "Kargoda" ? "bg-purple-100 text-purple-700" : order.fulfillment === "Teslim Edildi" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{order.fulfillment}</span>
                </td>
                <td className="py-2 px-4 text-xs">{order.products}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
