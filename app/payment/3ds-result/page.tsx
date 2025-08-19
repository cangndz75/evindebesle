import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export default async function Page({ searchParams }: { searchParams: { sid?: string; status?: string } }) {
  const { sid = "", status = "" } = searchParams || {};
  const ps = await prisma.paymentSession.findUnique({ where: { id: sid } });

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Ödeme Sonucu</h1>
      <p>Durum: <b>{status}</b></p>
      {ps?.error && (
        <details className="bg-gray-50 p-3 rounded">
          <summary>Detay</summary>
          <pre className="text-xs whitespace-pre-wrap">{ps.error}</pre>
        </details>
      )}
      <a className="text-blue-600 underline" href="/">Anasayfa</a>
    </div>
  );
}
