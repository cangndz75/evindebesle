import Link from "next/link";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SP = { sid?: string; status?: string; appointmentId?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const sid = sp.sid ?? "";
  const status = (sp.status ?? "").toUpperCase();
  const appointmentId = sp.appointmentId ?? "";

  const ps = sid
    ? await prisma.paymentSession.findUnique({
        where: { id: sid },
        select: { status: true, error: true, paymentId: true, orderId: true },
      })
    : null;

  const s = (ps?.status || status) as string;

  const isOk = s === "CAPTURED" || s === "AUTH_OK";
  const isFail = s === "FAILED" || s === "CAPTURE_FAIL";

  return (
    <div className="mx-auto max-w-xl p-6">
      {isOk ? (
        <>
          <h1 className="text-2xl font-semibold mb-2">Ödeme alındı ✅</h1>
          <p className="text-muted-foreground mb-4">
            İşleminiz başarıyla tamamlandı.
          </p>
          {appointmentId ? (
            <Link className="underline" href={`/success?appointmentId=${appointmentId}`}>
              Randevu sayfasına git
            </Link>
          ) : (
            <Link className="underline" href="/">
              Ana sayfaya dön
            </Link>
          )}
        </>
      ) : isFail ? (
        <>
          <h1 className="text-2xl font-semibold mb-2">Ödeme başarısız ❌</h1>
          <p className="text-muted-foreground mb-4">
            Banka doğrulaması tamamlanamadı. Lütfen tekrar deneyin.
          </p>
          {ps?.error && (
            <pre className="text-xs p-3 rounded bg-muted/40 overflow-auto mb-4">
              {ps.error}
            </pre>
          )}
          <div className="flex gap-4">
            <Link className="underline" href="/">
              Geri dön
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-2">Durum: {s || "Bilinmiyor"}</h1>
          <p className="text-muted-foreground">
            Ödeme sonucu işleniyor… Birazdan güncellenecek.
          </p>
        </>
      )}
    </div>
  );
}
