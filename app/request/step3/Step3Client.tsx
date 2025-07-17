"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import clsx from "clsx";
import Stepper from "@/app/(public)/_components/Stepper";
import { useRouter, useSearchParams } from "next/navigation";

export default function Step3Client() {
  const router = useRouter();
  const [cardRaw, setCardRaw] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
    setCardRaw(digitsOnly);
  };

  const formattedCardNumber = cardRaw.replace(/(.{4})/g, "$1 ").trim();
  const searchParams = useSearchParams();
  const totalPrice = parseInt(searchParams.get("totalPrice") || "0");

  return (
    <div className="min-h-screen grid md:grid-cols-2 overflow-hidden relative">
      <div className="flex flex-col px-4 py-6">
        <div className="mb-6 space-y-2">
          <Stepper activeStep={3} />
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground"
            >
              ← Geri
            </Button>

            <div className="text-sm text-muted-foreground font-medium">
              Toplam Tutar:{" "}
              <span className="text-lg font-bold text-black">
                {totalPrice.toLocaleString()}₺
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="w-full h-[200px] perspective">
              <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className={clsx(
                    "absolute w-full h-full p-6 rounded-xl text-white bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] shadow-xl",
                    "backface-hidden"
                  )}
                >
                  {/* <div className="text-right text-sm tracking-widest font-semibold">
                    DISCOVER
                  </div> */}
                  <div className="mt-6 text-xl tracking-widest font-mono">
                    {cardRaw ? formattedCardNumber : "•••• •••• •••• ••••"}
                  </div>
                  <div className="absolute bottom-6 left-6 text-xs">
                    <div className="opacity-70">Kart Sahibi</div>
                    <div className="font-semibold">
                      {cardName || "AD SOYAD"}
                    </div>
                  </div>
                  <div className="absolute bottom-6 right-6 text-xs text-right">
                    <div className="opacity-70">SKT</div>
                    <div className="font-semibold">
                      {expiryMonth || "AA"}/{expiryYear || "YY"}
                    </div>
                  </div>
                </div>

                <div
                  className={clsx(
                    "absolute w-full h-full p-6 rounded-xl text-white bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] shadow-xl",
                    "backface-hidden rotate-y-180"
                  )}
                >
                  <div className="h-12 bg-gray-800 w-full rounded-sm mb-6" />
                  <div className="text-xs">CVV</div>
                  <div className="bg-white text-black rounded px-2 py-1 inline-block mt-1 font-mono tracking-widest">
                    {cvv || "•••"}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Kart Numarası</Label>
                <Input
                  value={formattedCardNumber}
                  onChange={(e) => handleCardInput(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label>Kart Adı</Label>
                <Input
                  value={cardName}
                  onChange={(e) =>
                    setCardName(
                      e.target.value.replace(/[^A-Za-zÇçĞğİıÖöŞşÜü\s]/g, "")
                    )
                  }
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Ay</Label>
                  <select
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="">Ay</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = String(i + 1).padStart(2, "0");
                      return (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <Label>Yıl</Label>
                  <select
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="">Yıl</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={String(year).slice(2)}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input
                    value={cvv}
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    placeholder="CVV"
                    maxLength={3}
                    inputMode="numeric"
                    onFocus={() => setIsFlipped(true)}
                    onBlur={() => setIsFlipped(false)}
                  />
                </div>
              </div>

              <Button className="w-full mt-4">Ödemeyi Tamamla</Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/appointments", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        petIds: searchParams.getAll("pet"),
                        serviceIds: searchParams.getAll("service"),
                        dates: searchParams.getAll("date"),
                        isRecurring: searchParams.get("recurring") === "1",
                        recurringType: searchParams.get("recurringType"),
                        recurringCount: parseInt(
                          searchParams.get("recurringCount") || "1"
                        ),
                        timeSlot: searchParams.get("timeSlot") || null,
                        userNote: "",
                        userAddressId: searchParams.get("userAddressId"),
                      }),
                    });

                    if (!res.ok) throw new Error();

                    const data = await res.json();
                    console.log("Sipariş oluşturuldu:", data);
                    router.push("/success");
                  } catch (err) {
                    console.error("Sipariş oluşturulamadı", err);
                  }
                }}
              >
                Ödemesiz Tamamla (Test)
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden md:flex items-center justify-center bg-gray-50">
        <Image
          src="https://res.cloudinary.com/dlahfchej/image/upload/v1752619395/10_en3zvw.png"
          alt="Pet"
          fill
          className="object-cover"
        />
        <div className="absolute bottom-6 left-6 bg-white/90 rounded-lg p-4 shadow-md max-w-sm">
          <p className="text-sm text-gray-700 italic">
            “Ödeme ekranı çok modern ve kullanımı kolay 👌”
          </p>
          <p className="mt-2 font-semibold">Ali · İstanbul</p>
        </div>
      </div>
    </div>
  );
}
