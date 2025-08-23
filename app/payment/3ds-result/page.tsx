import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page({
  searchParams,
}: {
  searchParams: { sid?: string; status?: string };
}) {
  const { sid = "", status = "" } = searchParams;

  const ps = sid
    ? await prisma.paymentSession.findUnique({ where: { id: sid } })
    : null;

  if (!ps) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold text-red-600">Ödeme Sonucu</h1>
        <p>Oturum bulunamadı.</p>
        <a className="text-blue-600 underline" href="/">
          Anasayfa
        </a>
      </div>
    );
  }

  const isOk =
    status === "ok" || ps.status === "AUTH_OK" || ps.status === "CAPTURED";

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6 text-center">
      <h1 className="text-2xl font-bold">
        {isOk ? "✅ Ödeme Başarılı" : "❌ Ödeme Başarısız"}
      </h1>

      <div className="space-y-2 text-sm">
        <p>
          <b>Durum:</b> {ps.status}
        </p>
        {ps.orderId && (
          <p>
            <b>Sipariş No:</b> {ps.orderId}
          </p>
        )}
        {ps.appointmentId && (
          <p>
            <b>Randevu ID:</b> {ps.appointmentId}
          </p>
        )}
        {ps.error && (
          <p className="text-red-600">
            <b>Hata:</b> {ps.error}
          </p>
        )}
      </div>

      <div className="pt-4">
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-md bg-lime-600 text-white hover:bg-lime-700"
        >
          Anasayfaya Dön
        </a>
      </div>
    </div>
  );
}
