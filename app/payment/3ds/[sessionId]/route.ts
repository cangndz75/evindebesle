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
    const wait = `<!doctype html><html lang="tr"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>3D Secure yönlendiriliyor…</title>
<meta http-equiv="refresh" content="1" />
<style>body{margin:0;display:grid;place-items:center;height:100svh;font:16px system-ui;color:#222}
.spinner{width:56px;height:56px;border:6px solid #ddd;border-top-color:#6b46c1;border-radius:50%;animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(1turn)}}</style></head>
<body><div style="text-align:center"><div class="spinner"></div>
<div class="muted">Banka sayfası yükleniyor…</div></div></body></html>`;
    return new Response(wait, {
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
