import AppointmentDetailCard from "../_components/AppoinmentDetailCard";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Randevu Detayı</h1>
      <AppointmentDetailCard appointmentId={id} />
    </div>
  );
}
