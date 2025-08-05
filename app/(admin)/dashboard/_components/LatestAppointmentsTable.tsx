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
    <Card>
      <CardHeader>
        <CardTitle>Son Randevular</CardTitle>
        <CardDescription>Bugüne ait son randevular</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {appointments.map((a) => (
          <div
            key={a.id}
            className="flex justify-between items-center border p-2 rounded-md"
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
  );
}
