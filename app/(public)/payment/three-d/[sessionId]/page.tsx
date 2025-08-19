import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ sessionId: string }> };

export default async function Page({ params }: Props) {
  const { sessionId } = await params;
  const session = await prisma.paymentSession.findUnique({
    where: { id: sessionId },
    select: { threeDSHtml: true },
  });
  if (!session?.threeDSHtml) notFound();

  return (
    <main suppressHydrationWarning className="p-4">
      <div dangerouslySetInnerHTML={{ __html: session.threeDSHtml }} />
    </main>
  );
}
