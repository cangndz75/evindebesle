"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Stepper from "@/app/(public)/_components/Stepper";

const plans = [
  {
    id: "starter",
    name: "Başlangıç",
    price: 50,
    features: [
      "10 projeye kadar",
      "Temel analizler",
      "48 saat içinde destek yanıtı",
      "Sınırlı API erişimi",
      "Topluluk desteği",
    ],
    cta: "Ücretsiz Deneme Başlat",
    popular: false,
  },
  {
    id: "professional",
    name: "Profesyonel",
    price: 99,
    features: [
      "Sınırsız proje",
      "Gelişmiş analizler",
      "24 saat içinde destek yanıtı",
      "Tam API erişimi",
      "Öncelikli destek",
      "Ekip işbirliği",
      "Özel entegrasyonlar",
    ],
    cta: "Hemen Başla",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Kurumsal",
    price: 299,
    features: [
      "Profesyonel plandaki her şey",
      "Özel çözümler",
      "Özel müşteri temsilcisi",
      "1 saat içinde destek yanıtı",
      "SSO Kimlik Doğrulama",
      "Gelişmiş güvenlik",
      "Özel sözleşmeler",
      "SLA anlaşması",
    ],
    cta: "Satışla İletişime Geç",
    popular: false,
  },
];

export default function Step3Client() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState("professional");

  const handleSubmit = () => {
    const params = new URLSearchParams();
    searchParams.forEach((val, key) => params.append(key, val));
    params.set("plan", selectedPlan);
    router.push(`/request/summary?${params.toString()}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Stepper activeStep={3} />

      <div className="text-left mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground"
        >
          ← Geri
        </Button>
      </div>

      <div className="text-center my-10">
        <h1 className="text-3xl font-bold">Planını Seç</h1>
        <h2 className="text-5xl font-serif font-semibold mb-4 text-black">Yolculuğun Başlasın</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Bireysel kullanıcılardan kurumsal ekiplere kadar her ihtiyaca uygun bir plan tasarladık.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition ${
              plan.popular ? "border-2 border-red-500 shadow-xl" : "border"
            } ${selectedPlan === plan.id ? "ring-2 ring-black" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow">
                Popüler
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-center text-xl">{plan.name}</CardTitle>
              <p className="text-center text-3xl font-bold">
                ${plan.price}{" "}
                <span className="text-base font-normal">/ ay</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {feature}
                </div>
              ))}
              <Button className="w-full mt-4">{plan.cta}</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-10">
        <Button
          onClick={handleSubmit}
          className="px-8 py-4 rounded-full text-base font-semibold"
        >
          Devam Et
        </Button>
      </div>
    </div>
  );
}
