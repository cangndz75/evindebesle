"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function PaymentForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    cardHolderName: "Test Kullanıcı",
    cardNumber: "5526 0800 0000 0006",
    expireMonth: "12",
    expireYear: "2030",
    cvc: "000",
    totalPrice: "99.90",
    draftAppointmentId: "APPT1234",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // NEXT_PUBLIC_API_URL → http://localhost:3000
    const res = await fetch(
      `${process.env.API_URL}/api/iyzico/initiate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: form.totalPrice,
          cardHolderName: form.cardHolderName,
          cardNumber: form.cardNumber.replace(/\s+/g, ""),
          expireMonth: form.expireMonth,
          expireYear: form.expireYear,
          cvc: form.cvc,
        }),
      }
    );

    const data = await res.json();

    if (res.ok && data.data?.status === "success") {
      // Başarılıysa buraya
      console.log("Ödeme başarılı:", data.data);
      router.push("/success");
    } else {
      alert("Hata: " + (data.error || data.message || "Ödeme başlatılamadı"));
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-10">
      <div>
        <Label>Kart Üzerindeki İsim</Label>
        <Input
          name="cardHolderName"
          value={form.cardHolderName}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label>Kart Numarası</Label>
        <Input
          name="cardNumber"
          value={form.cardNumber}
          onChange={handleChange}
        />
      </div>
      <div className="flex gap-2">
        <div>
          <Label>Ay</Label>
          <Input
            name="expireMonth"
            value={form.expireMonth}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Yıl</Label>
          <Input
            name="expireYear"
            value={form.expireYear}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>CVV</Label>
          <Input
            name="cvc"
            value={form.cvc}
            onChange={handleChange}
            maxLength={3}
          />
        </div>
      </div>
      <div>
        <Label>Tutar (TL)</Label>
        <Input
          name="totalPrice"
          value={form.totalPrice}
          onChange={handleChange}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Yönlendiriliyor..." : "3D Secure ile Öde"}
      </Button>
    </form>
  );
}
