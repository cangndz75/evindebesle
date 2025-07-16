"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
        <h2 className="text-2xl font-bold text-gray-800">Ödemeniz Başarılı</h2>
        <p className="text-gray-600">
          Hizmetinizi “Siparişlerim” bölümünden takip edebilirsiniz.
        </p>
        <Button className="w-full mt-4" onClick={() => router.push("/")}>
          Anasayfaya Dön
        </Button>
      </div>
    </div>
  );
}
