"use client";

import { useEffect, useState } from "react";
import AppointmentRow from "./AppointmentsRow";

export default function AppointmentsTable() {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/appointments");
        if (!res.ok) throw new Error("Randevular alınamadı.");
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Veriler alınamadı.");
        setAppointments(data.data);
      } catch (err) {
        console.error("❌ Randevular alınamadı:", err);
        setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) return <div className="text-center py-4">Yükleniyor...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Hata: {error}</div>;
  if (appointments.length === 0) return <div className="text-center py-4">Randevu bulunamadı.</div>;

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-3">Kullanıcı</th>
              <th className="px-4 py-3">Evcil Hayvan</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Hizmetler</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type AppointmentWithRelations = {
  id: string;
  confirmedAt: string;
  status: string;
  user?: {
    name: string | null;
  } | null;
  pets: {
    ownedPet?: {
      name: string | null;
    } | null;
  }[];
  services: {
    service: {
      id: string;
      name: string;
    };
  }[];
};
