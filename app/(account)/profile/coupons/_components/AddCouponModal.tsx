"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type Props = {
  onSuccess: () => void;
};

export default function AddCouponModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error("Kupon kodu girin.");
    setLoading(true);
    try {
      const res = await fetch("/api/user-coupons", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
        headers: { "Content-Type": "application/json" },
      });

      let data: { error?: string; success?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Sunucu yanıtı okunamadı. Lütfen tekrar deneyin.");
      }

      if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
      toast.success("Kupon eklendi!");
      setOpen(false);
      setCode("");
      onSuccess(); // kuponlar yeniden yüklensin
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Kupon Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogTitle>Kupon Kodu Ekle</DialogTitle>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <Label htmlFor="code">Kupon Kodu</Label>
          <Input
            id="code"
            name="couponCode"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Örn: HOSGELDIN"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Ekleniyor..." : "Kuponu Kullan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
