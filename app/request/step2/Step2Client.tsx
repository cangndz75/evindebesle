"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Stepper from "@/app/(public)/_components/Stepper";
import DatePicker from "@/app/(public)/_components/DatePicker";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ServiceModal from "../_components/ServiceModal";

export default function Step2Client() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPrice = Number(searchParams.get("totalPrice") || 0);
  const [dates, setDates] = useState<Date[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<
    "daily" | "weekly" | "monthly" | ""
  >("");
  const [recurringCount, setRecurringCount] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const unitPrice = Number(searchParams.get("unitPrice") || 0);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const timeSlots = [
    { label: "08:00 - 12:00", value: "08:00 - 12:00" },
    { label: "12:00 - 16:00", value: "12:00 - 16:00" },
    { label: "16:00 - 20:00", value: "16:00 - 20:00" },
  ];

  const [timeSlot, setTimeSlot] = useState<string>("");

  useEffect(() => {
    const total = unitPrice * dates.length;
    setCalculatedPrice(total);
  }, [unitPrice, dates]);

  const handleDateSelect = (selectedDates: Date[]) => {
    if (!selectedDates || selectedDates.length === 0) {
      setDates([]);
      setDateRange({ start: null, end: null });
      return;
    }

    if (selectedDates.length === 1) {
      setDates([selectedDates[0]]);
      setDateRange({ start: selectedDates[0], end: null });
      return;
    }

    if (selectedDates.length === 2) {
      const [a, b] = selectedDates;
      const start = a < b ? a : b;
      const end = a < b ? b : a;

      const temp = new Date(start);
      const dayList: Date[] = [];

      while (temp <= end) {
        dayList.push(new Date(temp));
        temp.setDate(temp.getDate() + 1);
      }

      setDates(dayList);
      setDateRange({ start, end });
      return;
    }

    const uniqueDates = Array.from(
      new Set(selectedDates.map((d) => d.toDateString()))
    ).map((s) => new Date(s));

    setDates(uniqueDates);
    setDateRange({
      start: uniqueDates[0] ?? null,
      end: uniqueDates[uniqueDates.length - 1] ?? null,
    });
  };
  const handleNext = async () => {
    if (dates.length === 0) {
      toast.error("Lütfen en az bir tarih seçin.");
      return;
    }
    if (!timeSlot) {
      toast.error("Lütfen bir saat dilimi seçin.");
      return;
    }
    if (isRecurring) {
      if (!recurringType) {
        toast.error("Lütfen tekrar sıklığını seçin.");
        return;
      }
      if (recurringCount < 1) {
        toast.error("Tekrar sayısı en az 1 olmalıdır.");
        return;
      }
    }

    let draftAppointmentId: string;
    try {
      const draftRes = await fetch("/api/draft-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petIds: searchParams.getAll("pet"),
          serviceIds: searchParams.getAll("service"),
          dates: dates.map((d) => d.toISOString().split("T")[0]),
          userAddressId: searchParams.get("userAddressId"),
          timeSlot,
          isRecurring: Boolean(isRecurring),
          recurringType,
          recurringCount,
        }),
      });
      if (!draftRes.ok) throw new Error("Draft oluşturma başarısız");
      const draftJson = await draftRes.json();
      draftAppointmentId = draftJson.draftAppointmentId;
    } catch (err) {
      console.error("Draft hatası:", err);
      toast.error("Randevu hazırlanamıyor, lütfen tekrar deneyin.");
      return;
    }

    const params = new URLSearchParams();

    // Tüm mevcut parametreleri koru
    searchParams.forEach((val, key) => {
      // Bu alanları tekrar ekleyeceğiz aşağıda, şimdilik geç
      if (
        key === "date" ||
        key === "timeSlot" ||
        key === "totalPrice" ||
        key === "draftAppointmentId" ||
        key === "recurring" ||
        key === "recurringType" ||
        key === "recurringCount"
      ) {
        return;
      }
      params.append(key, val);
    });

    // Tarihleri ekle
    dates.forEach((d) => params.append("date", d.toISOString().split("T")[0]));

    // Yeni verileri set et
    params.set("timeSlot", timeSlot);
    params.set("totalPrice", calculatedPrice.toFixed(2));
    params.set("draftAppointmentId", draftAppointmentId);

    if (isRecurring) {
      params.set("recurring", "1");
      params.set("recurringType", recurringType);
      params.set("recurringCount", String(recurringCount));
    } else {
      params.set("recurring", "0");
    }

    router.push(`/request/step3?${params.toString()}`);
  };
  return (
    <div className="h-screen grid md:grid-cols-2 overflow-hidden relative">
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
              Lütfen hizmet alacağınız günü ya da tarih aralığını seçin.
            </p>
          </div>

          <div className="pl-4 md:pl-8">
            <DatePicker selected={dates} onSelect={handleDateSelect} />
          </div>

          <div className="flex justify-between items-center px-4 md:px-8 mt-6">
            <div />
            <div className="flex items-center gap-4">
              <ServiceModal
                selectedTime={timeSlot}
                setSelectedTime={setTimeSlot}
              />
              {timeSlot && (
                <span className="text-sm text-muted-foreground">
                  Seçilen: <strong>{timeSlot}</strong>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border rounded-lg px-4 py-3 mx-4 md:mx-8">
            <Label className="text-sm font-medium">
              Tekrarlayan Hizmet mi?
            </Label>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {isRecurring && (
            <div className="mx-4 md:mx-8 border rounded-lg p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">Tekrar Sıklığı</Label>
                <Select
                  value={recurringType}
                  onValueChange={(val) => setRecurringType(val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sıklık seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                    <SelectItem value="monthly">Aylık</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold">
                  Kaç kez tekrarlansın?
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={recurringCount}
                  onChange={(e) => setRecurringCount(parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
        {dates.length > 0 && (
          <div className="text-right px-4 md:px-8 pt-4">
            <p className="text-lg font-bold">
              Toplam Tutar: {calculatedPrice.toLocaleString()}₺
            </p>
          </div>
        )}
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
