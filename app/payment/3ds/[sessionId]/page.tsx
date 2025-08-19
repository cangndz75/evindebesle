import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export default async function Page({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const ps = await prisma.paymentSession.findUnique({ where: { id: sessionId } });

  if (!ps) return <div className="p-6">Oturum bulunamadı.</div>;
  if (!ps.threeDSHtml) return <div className="p-6">3D doğrulama içeriği henüz hazır değil.</div>;

  return <div dangerouslySetInnerHTML={{ __html: ps.threeDSHtml }} />;
}
