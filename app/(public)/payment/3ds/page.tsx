import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams: Promise<{ sid?: string }> };

export default async function ThreeDSPage({ searchParams }: Props) {
  const { sid } = await searchParams;
  if (!sid) notFound();

  const s = await prisma.paymentSession.findUnique({
    where: { id: sid },
    select: { threeDSHtml: true },
  });
  if (!s?.threeDSHtml) notFound();

  return (
    <main suppressHydrationWarning className="p-0 m-0">
      <div dangerouslySetInnerHTML={{ __html: s.threeDSHtml }} />
    </main>
  );
}
