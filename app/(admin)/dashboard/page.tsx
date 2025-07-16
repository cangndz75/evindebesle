"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Download,
  User,
  PawPrint,
  CalendarCheck,
  DollarSign,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function AdminDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState({
    users: 0,
    pets: 0,
    appointments: 0,
    revenue: 0,
  });

  const [latestAppointments, setLatestAppointments] = useState<
    {
      id: string;
      petName: string;
      serviceName: string;
      time: string;
      status: string;
    }[]
  >([]);

  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      start: format(today, "yyyy-MM-dd"),
      end: format(today, "yyyy-MM-dd"),
    };
  });

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setCounts((prev) => ({ ...prev, users: data.length }));
      });

    fetch("/api/pets")
      .then((res) => res.json())
      .then((data) => {
        setCounts((prev) => ({ ...prev, pets: data.length }));
      });

    fetch("/api/admin/summary")
      .then((res) => res.json())
      .then((data) =>
        setCounts((prev) => ({
          ...prev,
          pets: data.pets,
          appointments: data.appointments,
          revenue: data.revenue,
        }))
      );

    fetch("/api/admin/latest-appointments")
      .then((res) => res.json())
      .then(setLatestAppointments);
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
      description: "+%8 İstatistiksel artış",
      value: `+${counts.appointments}`,
      href: "/admin-appointments",
      icon: <CalendarCheck className="text-blue-600" />,
    },
    {
      title: "Evcil Hayvanlar",
      description: "Kayıtlı pet sayısı",
      value: `${counts.pets}`,
      href: "/admin-pets",
      icon: <PawPrint className="text-orange-500" />,
    },
    {
      title: "Kullanıcılar",
      description: "Sistemdeki aktif kullanıcılar",
      value: `${counts.users}`,
      href: "/users",
      icon: <User className="text-purple-600" />,
    },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Paneli</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-sm">
            <CalendarIcon className="mr-2 w-4 h-4" />
            {dateRange.start} - {dateRange.end}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            onClick={() => router.push(card.href)}
            className="cursor-pointer hover:shadow-md transition"
          >
            <CardHeader className="flex flex-row justify-between items-center">
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Genel</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Son Randevular</CardTitle>
          <CardDescription>Bugüne ait son randevular</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestAppointments.map((a) => (
            <div
              key={a.id}
              className="flex justify-between items-center p-2 border rounded-lg"
            >
              <div>
                <p className="font-semibold">{a.petName}</p>
                <p className="text-muted-foreground text-sm">{a.serviceName}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {a.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
