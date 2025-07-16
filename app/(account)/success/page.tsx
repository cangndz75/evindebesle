"use client";

import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Siparişiniz Alındı! 🎉</h1>
      <p className="text-muted-foreground mb-6">
        Randevunuz başarıyla oluşturuldu. Detayları Siparişlerim sayfasından takip edebilirsiniz.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/")}>Ana Sayfa</Button>
        <Button variant="outline" onClick={() => router.push("/account/orders")}>
          Siparişlerim
        </Button>
      </div>
    </div>
  );
}
