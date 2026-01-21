"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type Appointment = {
  id: string;
  petName: string;
  serviceName: string;
  time: string;
  status: string;
};

export default function LatestAppointmentsTable() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch("/api/admin/latest-appointments")
      .then((res) => res.json())
      .then(setAppointments);
  }, []);

  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">Son Randevular</CardTitle>
        <CardDescription className="text-sm">Bugüne ait son randevular</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-3">
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Henüz randevu bulunmuyor
          </div>
        ) : (
          appointments.map((a) => (
            <div
              key={a.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border border-gray-200 p-3 md:p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm md:text-base truncate">{a.petName}</p>
                <p className="text-gray-600 text-xs md:text-sm mt-1 truncate">{a.serviceName}</p>
                <p className="text-gray-500 text-xs mt-1">{a.time}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium self-start sm:self-auto whitespace-nowrap">
                {a.status}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
