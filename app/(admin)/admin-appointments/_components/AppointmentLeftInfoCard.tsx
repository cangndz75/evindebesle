"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  PawPrint,
  StickyNote,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AppointmentWithRelations = {
  id: string;
  confirmedAt: string;
  status: string;
  adminNote?: string | null;
  allergy?: string | null;
  sensitivity?: string | null;
  specialRequest?: string | null;
  district?: {
    name: string;
  };
  fullAddress?: string;
  ownedPet: {
    name: string;
    image?: string | null;
    age?: number | null;
    species?: string | null;
    gender?: string | null;
    pet?: {
      type?: string;
      breed?: string;
    };
  };
  services: {
    service: {
      id: string;
      name: string;
    };
  }[];
};

export default function AppointmentLeftInfoCard({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [appointment, setAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/admin/appointments/${appointmentId}`);
        const json = await res.json();
        setAppointment(json?.data || null);
      } catch (err) {
        console.error("Hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="space-y-4 border rounded-lg p-6 shadow-sm bg-white animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="flex gap-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-6 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-24 bg-gray-100 rounded" />
          </div>
        </div>

        <div className="w-full h-52 bg-gray-200 rounded-lg" />

        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>

        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-16 w-full bg-gray-100 rounded" />
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="space-y-6 border rounded-lg p-6 shadow-sm bg-white">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-muted-foreground" />
            {appointment.ownedPet.name} için Hizmet Detayı
          </h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(appointment.confirmedAt), "d MMMM yyyy", {
                locale: tr,
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(new Date(appointment.confirmedAt), "HH:mm", {
                locale: tr,
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <Badge variant="outline">{appointment.status}</Badge>
          <Button size="sm" variant="outline">
            Durumu Değiştir
          </Button>
        </div>
      </div>

      {appointment.ownedPet.image && (
        <img
          src={appointment.ownedPet.image}
          alt="Pet"
          className="w-full h-52 object-cover rounded-lg shadow"
        />
      )}

      {appointment.district?.name && appointment.fullAddress && (
        <div className="space-y-1 text-sm">
          <h3 className="font-semibold text-sm mb-1">Adres Bilgisi</h3>
          <p className="text-muted-foreground">
            {appointment.district.name} / {appointment.fullAddress}
          </p>
        </div>
      )}

      <div className="space-y-1">
        <h3 className="font-semibold text-sm mb-1">İstenen Hizmetler</h3>
        {appointment.services.map((s) => (
          <div key={s.service.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              defaultChecked
              disabled
              className="w-4 h-4"
            />
            <label>{s.service.name}</label>
          </div>
        ))}
      </div>

      {appointment.allergy && (
        <div>
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Alerjiler
          </h3>
          <div className="flex flex-wrap gap-2">
            {appointment.allergy.split(",").map((item, i) => (
              <span
                key={i}
                className="bg-red-100 text-red-700 text-xs rounded px-2 py-1"
              >
                {item.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {appointment.sensitivity && (
        <div>
          <h3 className="font-semibold text-sm mb-1">Hassasiyet Bilgisi</h3>
          <p className="text-sm text-muted-foreground">
            {appointment.sensitivity}
          </p>
        </div>
      )}

      {appointment.specialRequest && (
        <div>
          <h3 className="font-semibold text-sm mb-1">Özel İstekler</h3>
          <p className="text-sm text-muted-foreground">
            {appointment.specialRequest}
          </p>
        </div>
      )}

      {appointment.adminNote && (
        <div>
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
            <StickyNote className="w-4 h-4 text-muted-foreground" />
            Admin Notu
          </h3>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            value={appointment.adminNote}
            rows={4}
            disabled
          />
        </div>
      )}
    </div>
  );
}
