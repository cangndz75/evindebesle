import { getOrderById } from "@/lib/order";
import { PrintLabel } from "./PrintLabel";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return <div>Sipariş bulunamadı.</div>;

  return <PrintLabel order={order} />;
}
