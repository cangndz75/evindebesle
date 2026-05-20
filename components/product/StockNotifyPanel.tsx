"use client";

import { useState } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type StockNotifyPanelProps = {
  productId: string;
  variantId?: string | null;
  colorId?: string | null;
  sizeId?: string | null;
  defaultEmail?: string;
  description?: string;
  className?: string;
};

export default function StockNotifyPanel({
  productId,
  variantId,
  colorId,
  sizeId,
  defaultEmail = "",
  description = "Bu ürün şu an stoklarımızda yok. Yenilendiğinde ilk senin haberin olsun.",
  className = "",
}: StockNotifyPanelProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("E-posta adresi gerekli");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/products/stock-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          email: email.trim(),
          variantId: variantId ?? undefined,
          colorId: colorId ?? undefined,
          sizeId: sizeId ?? undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Bir hata oluştu"
        );
      }

      setDone(true);
      toast.success(
        data.message || "Stoğa girince e-posta ile haber vereceğiz."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div
        className={`rounded-xl border border-green-200 bg-green-50/80 p-5 text-center ${className}`}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
          <Check className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-gray-900">Kaydınız alındı</p>
        <p className="mt-1 text-xs text-gray-600 leading-relaxed">
          Ürün stoğa girdiğinde <strong>{email}</strong> adresine haber vereceğiz.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-[#e8e4df] bg-[#faf9f7] p-5 ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-[#e8e4df] text-[#111]">
          <BellRing className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <p className="text-sm leading-relaxed text-gray-700 pt-1">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          required
          disabled={loading}
          className="h-12 flex-1 border-[#ddd] bg-white text-sm focus-visible:ring-[#111]"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-12 shrink-0 bg-[#111] px-6 text-sm font-medium uppercase tracking-wide hover:bg-[#333]"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Gelince Haber Ver"
          )}
        </Button>
      </form>
    </div>
  );
}
