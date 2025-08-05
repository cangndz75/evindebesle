"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, CalendarCheck, PawPrint, User } from "lucide-react";
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
    pets: 0,
    appointments: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((res) => res.json())
      .then((data) =>
        setCounts({
          users: data.users,
          pets: data.pets,
          appointments: data.appointments,
          revenue: data.revenue,
        })
      );
  }, []);

  const cards = [
    {
      title: "Toplam Gelir",
      description: "+%15 bu ay",
      value: `${counts.revenue.toLocaleString()} ₺`,
      href: "/reports",
      icon: <DollarSign className="text-green-600" />,
    },
    {
      title: "Randevular",
      description: "+%8 artış",
      value: `${counts.appointments}`,
      href: "/admin-appointments",
      icon: <CalendarCheck className="text-blue-600" />,
    },
    {
      title: "Evcil Hayvanlar",
      description: "Kayıtlı pet",
      value: `${counts.pets}`,
      href: "/admin-pets",
      icon: <PawPrint className="text-orange-500" />,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          onClick={() => router.push(card.href)}
          className="cursor-pointer hover:shadow-md transition"
        >
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </div>
            <div className="p-2 rounded-full bg-muted">{card.icon}</div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
