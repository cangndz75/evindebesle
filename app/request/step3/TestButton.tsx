"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTransition } from "react";

type Props = {
  appointmentData: {
    ownedPetId: string;
    services: string[];
    repeatCount?: number;
    repeatInterval?: string | null;
    timeSlot?: string;
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
        toast.error(result?.error || "Bir hata oluştu.");
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
