"use client";

import AppointmentLeftInfoCard from "./AppointmentLeftInfoCard";
import AppointmentUserInfoCard from "./AppointmentUserInfoCard";

export default function AppointmentDetailCard({
  appointmentId,
}: {
  appointmentId: string;
}) {
  return (
    <div className="space-y-6">
      {/* <h1 className="text-2xl font-bold">Randevu Detayı</h1> */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <AppointmentLeftInfoCard appointmentId={appointmentId} />
        </div>
        <div>
          <AppointmentUserInfoCard appointmentId={appointmentId} />
        </div>
      </div>
    </div>
  );
}
