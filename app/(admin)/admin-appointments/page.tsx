import AppointmentsTable from "./_components/AppointmentsTable";

export default function AdminAppointmentsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tüm Randevular</h1>
      <AppointmentsTable />
    </div>
  );
}
