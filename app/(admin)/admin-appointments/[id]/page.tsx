import AppointmentDetailCard from "../_components/AppoinmentDetailCard";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>; 
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <AppointmentDetailCard appointmentId={id} />
    </div>
  );
}
