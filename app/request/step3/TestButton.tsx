"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTransition } from "react";

type Props = {
  appointmentData: {
    petIds: string[];
    serviceIds: string[];
    dates: string[];
    timeSlot: string;
    isRecurring?: boolean;
    recurringType?: string | null;
    recurringCount?: number;
    userNote?: string;
    allergy?: string;
    sensitivity?: string;
    specialRequest?: string;
  };
};

export default function TestButton({ appointmentData }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await res.json();

      if (result?.success) {
        toast.success("Sipariş başarıyla oluşturuldu!");
      } else {
        toast.error(result?.message || result?.error || "Bir hata oluştu.");
      }
    });
  };

  return (
    <div className="text-center">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Gönderiliyor..." : "TEST BUTONU"}
      </Button>
    </div>
  );
}
