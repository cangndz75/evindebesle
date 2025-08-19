import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export default async function Page({ searchParams }: { searchParams: { sid?: string } }) {
  const sid = searchParams?.sid || "";
  const ps = await prisma.paymentSession.findUnique({ where: { id: sid } });

  if (!ps) return <div className="p-6">Oturum bulunamadı.</div>;
  if (!ps.threeDSHtml) return <div className="p-6">3D doğrulama içeriği henüz hazır değil.</div>;

  return <div dangerouslySetInnerHTML={{ __html: ps.threeDSHtml }} />;
}
