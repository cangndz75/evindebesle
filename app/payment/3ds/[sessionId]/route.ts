import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const ps = await prisma.paymentSession.findUnique({
    where: { id: sessionId },
    select: { threeDSHtml: true },
  });

  if (!ps?.threeDSHtml) {
    return new Response("<h1>3D sayfası hazırlanıyor…</h1>", {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(ps.threeDSHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
