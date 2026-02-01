"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, ShoppingBag, Package, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StatCards() {
  const router = useRouter();
  const [counts, setCounts] = useState({
    users: 0,
    orders: 0,
    products: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((res) => res.json())
      .then((data) =>
        setCounts({
          users: data.users || 0,
          orders: data.orders || 0,
          products: data.products || 0,
          revenue: data.revenue || 0,
        })
      );
  }, []);

  const cards = [
    {
      title: "Toplam Gelir",
      description: "+%15 bu ay",
      value: `${counts.revenue.toLocaleString()} ₺`,
      href: "/admin-reports",
      icon: <DollarSign className="text-green-600" />,
    },
    {
      title: "Siparişler",
      description: "Toplam sipariş",
      value: `${counts.orders}`,
      href: "/admin-orders",
      icon: <ShoppingBag className="text-blue-600" />,
    },
    {
      title: "Ürünler",
      description: "Aktif ürün",
      value: `${counts.products}`,
      href: "/admin-products",
      icon: <Package className="text-orange-500" />,
    },
    {
      title: "Kullanıcılar",
      description: "Aktif kullanıcı",
      value: `${counts.users}`,
      href: "/users",
      icon: <User className="text-purple-600" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          onClick={() => router.push(card.href)}
          className="cursor-pointer hover:shadow-md transition border border-gray-200"
        >
          <CardHeader className="flex flex-row justify-between items-start p-4 pb-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm md:text-base font-semibold truncate">{card.title}</CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">{card.description}</CardDescription>
            </div>
            <div className="p-2 md:p-3 rounded-full bg-gray-50 flex-shrink-0 ml-2">
              {card.icon}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-xl md:text-3xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
