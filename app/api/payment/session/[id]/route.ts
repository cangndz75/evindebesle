import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ps = await prisma.paymentSession.findUnique({
    where: { id },
    select: { id: true, status: true, amount: true, currency: true, error: true },
  });

  if (!ps) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(ps);
}
