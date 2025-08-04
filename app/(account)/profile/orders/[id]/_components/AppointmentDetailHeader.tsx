"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  PawPrint,
  CheckCircle,
  XCircle,
} from "lucide-react";

type Props = {
  petName: string;
  userName: string;
  fullAddress: string;
  districtName: string;
  confirmedAt: string;
  timeSlot?: string;
  status: string;
  services: { name: string; isCompleted?: boolean }[];
};

export default function AppointmentDetailHeader({
  petName,
  userName,
  fullAddress,
  districtName,
  confirmedAt,
  timeSlot,
  status,
  services,
}: Props) {
  const renderStatus = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: "Planlandı",
      COMPLETED: "Tamamlandı",
      CANCELED: "İptal Edildi",
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
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <PawPrint size={22} className="text-primary" />
            {/* {petName} - Randevu Detayı */}
            Randevu Detayı
          </CardTitle>

          <div className="text-base text-muted-foreground space-y-1">
            {/* <p className="flex items-center gap-2">
              <User size={16} /> Kullanıcı:{" "}
              <span className="font-medium text-black">{userName}</span>
            </p> */}
            <p className="flex items-center gap-2">
              <MapPin size={16} /> Adres: {districtName}, {fullAddress}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays size={16} /> Tarih:{" "}
              {format(new Date(confirmedAt), "PPP", { locale: tr })}
              {timeSlot && (
                <>
                  • <Clock size={14} className="inline-block mb-0.5" />{" "}
                  {timeSlot}
                </>
              )}
            </p>
          </div>
        </div>

        <div>{renderStatus(status)}</div>
      </CardHeader>

      <CardContent className="mt-2 space-y-2">
        <p className="text-base font-medium text-gray-800">Alınan Hizmetler:</p>
        <ul className="list-disc ml-6 text-base text-gray-700 space-y-1">
          {services.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              {s.name}
              {s.isCompleted !== undefined && (
                <span className="flex items-center gap-1 text-sm">
                  {s.isCompleted ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <XCircle size={14} className="text-gray-400" />
                  )}
                  <span
                    className={`${
                      s.isCompleted ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    ({s.isCompleted ? "Tamamlandı" : "Yapılmadı"})
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
