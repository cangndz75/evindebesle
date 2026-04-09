export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sipariş Detayı</h1>
      <div className="text-gray-700">Sipariş No: <span className="font-mono">#DV-{orderId}</span></div>
      <div className="mt-4 text-gray-500">(Burada sipariş detayları gösterilecek.)</div>
    </div>
  );
}
