"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import Stepper from "@/app/(public)/_components/Stepper";
import DatePicker from "@/app/(public)/_components/DatePicker";

export default function Step2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dates, setDates] = useState<Date[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleNext = () => {
    const params = new URLSearchParams();
    searchParams.forEach((val, key) => params.append(key, val));
    dates.forEach((d) =>
      params.append("date", d.toISOString().split("T")[0])
    );
    params.set("recurring", isRecurring ? "1" : "0");
    router.push(`/request/step3?${params.toString()}`);
  };

  return (
    <div className="h-screen grid md:grid-cols-2 overflow-hidden relative">
      {/* SOL */}
      <div className="flex flex-col justify-between px-6 py-6 overflow-hidden">
        <div className="space-y-6 overflow-y-auto pr-2">
          <Stepper activeStep={2} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground"
          >
            ← Geri
          </Button>

          <div className="pl-4 md:pl-8">
            <h1 className="text-2xl font-bold">Hizmet Tarih(ler)i</h1>
            <p className="text-muted-foreground text-sm">
              Hangi gün(ler) hizmet alınacak?
            </p>
          </div>

          <div className="pl-4 md:pl-8">
            <DatePicker selected={dates} onSelect={setDates} />
          </div>

          <div className="flex items-center justify-between border rounded-lg px-4 py-3 mx-4 md:mx-8">
            <Label className="text-sm font-medium">Tekrarlayan Hizmet mi?</Label>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
        </div>

        <div className="pt-4 text-right px-4 md:px-8">
          <Button
            onClick={handleNext}
            disabled={dates.length === 0}
            className="w-full md:w-auto px-8 py-4 rounded-full text-base font-semibold"
          >
            Ödeme Planına Geç
          </Button>
        </div>
      </div>

      {/* SAĞ */}
      <div className="relative hidden md:flex items-center justify-center bg-gray-50">
        <Image
          src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0"
          alt="Dog"
          fill
          className="object-cover"
        />
        <div className="absolute bottom-6 left-6 bg-white/90 rounded-lg p-4 shadow-md max-w-sm">
          <p className="text-sm text-gray-700 italic">
            “Hizmet günlerini seçmek çok kolaydı. Süper sistem 👌”
          </p>
          <p className="mt-2 font-semibold">Zeynep · İstanbul</p>
        </div>
      </div>
    </div>
  );
}
