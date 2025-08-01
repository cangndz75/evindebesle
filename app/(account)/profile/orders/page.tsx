"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import ReviewModal from "./_components/ReviewModal";

type Appointment = {
  id: string;
  timeSlot: string | null;
  status: string;
  confirmedAt: string;
  ownedPet: {
    name: string;
  } | null;
  services: {
    service: {
      name: string;
    };
  }[];
  address?: {
    fullAddress: string;
    district: {
      name: string;
    };
  } | null;
};

export default function OrdersPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(data.data))
      .finally(() => setLoading(false));
  }, []);

  const renderStatus = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: "Planlandı",
      COMPLETED: "Tamamlandı",
      CANCELED: "İptal",
      MISSED: "Kaçırıldı",
    };
    const colorMap: Record<string, string> = {
      SCHEDULED: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELED: "bg-red-100 text-red-800",
      MISSED: "bg-gray-200 text-gray-600",
    };

    return (
      <Badge className={`${colorMap[status]} px-3 py-1 text-sm rounded-md`}>
        {map[status] || status}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Randevularım</h1>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      )}

      {!loading && appointments?.length === 0 && (
        <p className="text-muted-foreground text-center mt-8">
          Henüz bir randevunuz bulunmamaktadır.
        </p>
      )}

      {!loading && appointments && appointments.length > 0 && (
        <div className="space-y-4">
          {appointments.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-md shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex flex-col">
                <span className="font-semibold">
                  {item.ownedPet?.name || "Evcil Hayvan"} Randevu Detayı
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(item.confirmedAt), "PPPp", { locale: tr })}
                  {item.timeSlot ? ` • Saat: ${item.timeSlot}` : ""}
                </span>
                {item.address && (
                  <span className="text-sm text-muted-foreground">
                    {item.address.district?.name} - {item.address.fullAddress}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {renderStatus(item.status)}
                <Button
                  variant="outline"
                  onClick={() => router.push(`/profile/orders/${item.id}`)}
                >
                  Detay
                </Button>
                {item.status === "COMPLETED" && (
                  <ReviewModal appointmentId={item.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
