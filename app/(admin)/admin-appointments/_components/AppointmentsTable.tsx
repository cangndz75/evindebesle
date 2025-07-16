"use client";

import { useEffect, useState } from "react";
import AppointmentRow from "./AppointmentsRow";

export default function AppointmentsTable() {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>(
    []
  );

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/admin/appointments");
        const data = await res.json();
        setAppointments(data.data); 
      } catch (err) {
        console.error("Randevular alınamadı:", err);
      }
    };

    fetchAppointments();
  }, []);

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
  user: {
    name: string | null;
  };
  ownedPet: {
    name: string;
  };
  services: {
    service: {
      id: string;
      name: string;
    };
  }[];
};
