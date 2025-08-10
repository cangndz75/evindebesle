"use client";

import { useState } from "react";
import { Clock3, Repeat } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface Step2FormProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIME_SLOTS = [
  { label: "Sabah (08:00 - 12:00)", value: "morning" },
  { label: "Öğle (12:00 - 16:00)", value: "noon" },
  { label: "Akşam (16:00 - 20:00)", value: "evening" },
];

const REPEAT_OPTIONS = [
  { label: "Tek Seferlik", value: "none" },
  { label: "Günlük", value: "daily" },
  { label: "Haftalık", value: "weekly" },
  { label: "Aylık", value: "monthly" },
];

export default function Step2Form({
  formData,
  setFormData,
  onNext,
  onBack,
}: Step2FormProps) {
  const [timeSlot, setTimeSlot] = useState<string>(formData.timeSlot || "");
  const [repeatType, setRepeatType] = useState<string>(
    formData.recurringType || "none"
  );
  const [repeatCount, setRepeatCount] = useState<number | null>(
    formData.recurringCount ?? null
  );

  const handleNext = () => {
    if (!timeSlot) return toast.error("Lütfen saat aralığı seçin.");

    const updated = {
      ...formData,
      timeSlot,
      isRecurring: repeatType !== "none",
      recurringType: repeatType !== "none" ? repeatType : null,
      recurringCount: repeatType !== "none" ? repeatCount : null,
    };

    if (updated.isRecurring && !repeatCount) {
      return toast.error("Lütfen tekrar sayısını girin.");
    }

    setFormData(updated);
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Saat aralığı */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Clock3 className="w-4 h-4" /> Saat Aralığı
        </Label>
        <RadioGroup
          value={timeSlot}
          onValueChange={setTimeSlot}
          className="space-y-2"
        >
          {TIME_SLOTS.map((slot) => (
            <div key={slot.value} className="flex items-center gap-3">
              <RadioGroupItem value={slot.value} id={slot.value} />
              <Label htmlFor={slot.value}>{slot.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Tekrar seçimi */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Repeat className="w-4 h-4" /> Tekrar Türü
        </Label>
        <RadioGroup
          value={repeatType}
          onValueChange={setRepeatType}
          className="space-y-2"
        >
          {REPEAT_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>

        {/* Tekrar sayısı */}
        {repeatType !== "none" && (
          <div className="mt-2">
            <Label className="block mb-1">Toplam tekrar sayısı</Label>
            <Input
              type="number"
              min={1}
              value={repeatCount || ""}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
              className="w-32"
            />
          </div>
        )}
      </div>

      {/* Butonlar */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Geri
        </Button>
        <Button onClick={handleNext}>Devam Et</Button>
      </div>
    </div>
  );
}
