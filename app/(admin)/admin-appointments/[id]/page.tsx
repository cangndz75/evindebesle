import AppointmentDetailCard from "../_components/AppoinmentDetailCard";

export default function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Randevu Detayı</h1>
      <AppointmentDetailCard appointmentId={params.id} />
    </div>
  );
}
