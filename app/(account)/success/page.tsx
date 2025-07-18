"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const paidPrice = searchParams.get("paidPrice");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const updateAppointment = async () => {
      if (!appointmentId || !paidPrice || updated) return;

      try {
        await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId, paidPrice }),
        });
        setUpdated(true);
      } catch (err) {
        console.error("💥 Güncelleme hatası:", err);
      }
    };

    updateAppointment();
  }, [appointmentId, paidPrice, updated]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Siparişiniz Alındı! 🎉</h1>
      <p className="text-muted-foreground mb-6">
        Randevunuz başarıyla oluşturuldu. Detayları Siparişlerim sayfasından
        takip edebilirsiniz.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/")}>Ana Sayfa</Button>
        <Button
          variant="outline"
          onClick={() => router.push("/profile/orders")}
        >
          Siparişlerim
        </Button>
      </div>
    </div>
  );
}
