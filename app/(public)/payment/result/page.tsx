import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams: Promise<{ sid?: string; status?: string }> };

export default async function ResultPage({ searchParams }: Props) {
  const { sid, status } = await searchParams;
  if (!sid) notFound();
  const ok = status === "ok";
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-2">
        {ok ? "3D Doğrulama Başarılı" : "3D Doğrulama Başarısız"}
      </h1>
      <p className="text-gray-600 mb-6">
        {ok ? "Ödeme tamamlanıyor. Lütfen bu sayfayı kapatmayın."
            : "İşlem tamamlanamadı. Tekrar deneyebilirsiniz."}
      </p>
      <FinalizeCapture sid={sid} autoStart={ok} />
      <div className="mt-8 text-sm text-gray-500">Oturum: {sid}</div>
      <div className="mt-6"><Link href="/" className="underline">Ana sayfaya dön</Link></div>
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";

function FinalizeCapture({ sid, autoStart }: { sid: string; autoStart?: boolean }) {
  const [state, setState] = useState<"idle"|"posting"|"ok"|"fail">("idle");
  const [detail, setDetail] = useState<string>("");

  async function run() {
    try {
      setState("posting");
      const res = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok !== false) {
        setState("ok");
        setDetail("Ödeme tahsil edildi.");
      } else {
        setState("fail");
        setDetail(data?.detail?.errorMessage || data?.error || "Tahsilat başarısız.");
      }
    } catch (e: any) {
      setState("fail");
      setDetail(String(e?.message ?? e));
    }
  }

  useEffect(() => { if (autoStart && state === "idle") run(); }, [autoStart, state]);

  if (!autoStart && state === "idle") {
    return <button onClick={run} className="rounded-lg px-4 py-2 bg-black text-white">Ödemeyi Tamamla</button>;
  }

  return (
    <div className="rounded-lg border p-4">
      {state === "posting" && <div>Ödeme tahsil ediliyor…</div>}
      {state === "ok" && <div className="text-green-600 font-medium">Başarılı ✓</div>}
      {state === "fail" && (
        <div className="text-red-600">
          Başarısız. <button onClick={run} className="underline">Tekrar dene</button>
          {detail ? <div className="mt-2 text-xs text-gray-500">{detail}</div> : null}
        </div>
      )}
      {state === "idle" && autoStart && <div>Hazırlanıyor…</div>}
    </div>
  );
}
