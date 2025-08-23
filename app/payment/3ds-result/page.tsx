import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page({
  searchParams,
}: {
  searchParams: { sid?: string; status?: string; appointmentId?: string };
}) {
  const { sid = "", status = "", appointmentId } = searchParams;

  const ps = sid
    ? await prisma.paymentSession.findUnique({ where: { id: sid } })
    : null;

  if (!ps) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-4 text-center">
        <h1 className="text-xl font-semibold text-red-600">Ödeme Sonucu</h1>
        <p>❌ Oturum bulunamadı.</p>
        <a className="text-blue-600 underline" href="/">
          Anasayfa
        </a>
      </div>
    );
  }

  const isCaptured = ps.status === "CAPTURED";
  const isAuthOk = ps.status === "AUTH_OK";
  const isFail =
    ps.status === "FAILED" || ps.status === "CAPTURE_FAIL" || status === "fail";

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6 text-center">
      <h1 className="text-2xl font-bold">
        {isCaptured
          ? "✅ Ödeme Başarılı ve Tahsil Edildi"
          : isAuthOk
          ? "✅ 3D Doğrulama Başarılı, Tahsilat Bekleniyor"
          : isFail
          ? "❌ Ödeme Başarısız"
          : "ℹ️ İşlem Durumu"}
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
        {(appointmentId || ps.appointmentId) && (
          <p>
            <b>Randevu ID:</b> {appointmentId || ps.appointmentId}
          </p>
        )}
        {ps.error && (
          <details className="bg-red-50 p-3 rounded text-left">
            <summary className="cursor-pointer text-red-600 font-medium">
              Hata Detayı
            </summary>
            <pre className="text-xs whitespace-pre-wrap">{ps.error}</pre>
          </details>
        )}
      </div>

      <div className="pt-4 flex flex-col gap-2">
        {(appointmentId || ps.appointmentId) && (
          <a
            href={`/orders/${appointmentId || ps.appointmentId}`}
            className="inline-block px-6 py-2 rounded-md bg-lime-600 text-white hover:bg-lime-700"
          >
            Randevuya Git
          </a>
        )}
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-800"
        >
          Anasayfaya Dön
        </a>
      </div>
    </div>
  );
}
