import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams: Promise<{ sid?: string }> };

export default async function ThreeDSPage({ searchParams }: Props) {
  const { sid } = await searchParams;        // <-- önemli
  if (!sid) notFound();

  const session = await prisma.paymentSession.findUnique({
    where: { id: sid },
    select: { threeDSHtml: true },
  });
  if (!session?.threeDSHtml) notFound();

  return (
    <main suppressHydrationWarning className="p-4">
      <div dangerouslySetInnerHTML={{ __html: session.threeDSHtml }} />
    </main>
  );
}
