"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ContactForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [statusText, setStatusText] = useState("İletişime Geç");

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Lütfen ad soyad girin");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Lütfen e-posta adresinizi girin");
      return;
    }

    if (!form.message.trim()) {
      toast.error("Lütfen mesajınızı girin");
      return;
    }

    setStatusText("Gönderiliyor...");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatusText("Hata oluştu");
        toast.error(data?.error || "Mesaj gönderilemedi");
        return;
      }

      setStatusText("Mesajınız iletildi");
      toast.success("Mesajınız alındı, en kısa sürede dönüş yapacağız.");
      setForm({ name: "", email: "", phone: "", message: "" });

      startTransition(() => {
        setTimeout(() => {
          if (data?.ticketId) {
            router.push(`/profile/support/${data.ticketId}`);
            return;
          }
          router.refresh();
        }, 600);
      });
    } catch {
      setStatusText("Hata oluştu");
      toast.error("Mesaj gönderilemedi");
    }
  };

  return (
    <div className="bg-white p-8 shadow-xl rounded-lg w-full max-w-2xl">
      <p className="text-sm text-primary font-semibold uppercase mb-1 tracking-wide">
        İletişim Formu
      </p>
      <h2 className="text-3xl font-bold text-black mb-6">Bize Ulaşın</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Ad Soyad"
          className="border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus:border-black"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          placeholder="Telefon"
          className="border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus:border-black"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      <Input
        placeholder="E-posta *"
        className="mt-6 border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus:border-black"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <Textarea
        placeholder="Mesajınız *"
        className="mt-6 border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus:border-black resize-none"
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />

      <Button
        className="mt-8 w-full bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2"
        onClick={handleSubmit}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {statusText}
      </Button>
    </div>
  );
}
