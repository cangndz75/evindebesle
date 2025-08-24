"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Payment3DSResultClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("FAILED");
  const [sid, setSid] = useState("");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    const s = searchParams.get("status");
    const id = searchParams.get("sid");
    if (s) setStatus(s);
    if (id) setSid(id);
  }, [searchParams]);

  useEffect(() => {
    if (!sid) return;
    (async () => {
      try {
        const res = await fetch(`/api/payment/session?id=${sid}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setErrorDetail(data?.error || null);
        }
      } catch {
        setErrorDetail(null);
      }
    })();
  }, [sid]);

  const isSuccess =
    status === "CAPTURED" ||
    status === "AUTH_OK" ||
    status.toLowerCase() === "success";

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
      {isSuccess ? (
        <>
          <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Ödeme Başarılı</h1>
          <p className="text-muted-foreground mb-6">
            Ödemeniz başarıyla tamamlandı.
          </p>
          <Button asChild>
            <a href="/orders">Siparişlerime Git</a>
          </Button>
        </>
      ) : (
        <>
          <XCircle className="w-16 h-16 text-red-600 mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Ödeme Başarısız</h1>
          <p className="text-muted-foreground mb-4">
            Banka doğrulaması tamamlanamadı. Lütfen tekrar deneyin.
          </p>
          {errorDetail && errorDetail !== "undefined" && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-6 max-w-md w-full text-sm break-words">
              {errorDetail}
            </div>
          )}
          <Button asChild>
            <a href="/">Geri dön</a>
          </Button>
        </>
      )}
    </div>
  );
}
