"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

type User = {
  name: string;
  email: string;
  phone: string;
};

function normalizePhoneInput(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return digits.slice(0, 11);
  return digits.slice(0, 10);
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return true;
  if (digits.startsWith("0")) return digits.length === 11;
  return /^[1-9]\d{9}$/.test(digits);
}

export default function ProfileDetails() {
  const [user, setUser] = useState<User | null>(null);
  const [initialUser, setInitialUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (!res.ok) throw new Error("Kullanici bilgileri alinamadi");
        const data = await res.json();
        const source = data?.user ?? data;
        const mappedUser: User = {
          name: source?.name ?? "",
          email: source?.email ?? "",
          phone: source?.phone ?? "",
        };

        setUser(mappedUser);
        setInitialUser(mappedUser);
      } catch {
        toast.error("Kullanıcı bilgileri alınamadı");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const updateUser = async () => {
    if (!user) return;

    const normalizedName = user.name.trim();
    const normalizedPhone = normalizePhoneInput(user.phone);

    if (!normalizedName) {
      toast.error("Ad soyad boş olamaz");
      return;
    }

    if (!isValidPhone(normalizedPhone)) {
      toast.error("Telefon numarası 0 ile başlıyorsa 11 hane, 1-9 ile başlıyorsa 10 hane olmalıdır.");
      return;
    }

    if (
      initialUser &&
      normalizedName === (initialUser.name || "").trim() &&
      normalizedPhone === (initialUser.phone || "").trim()
    ) {
      toast.info("Değişiklik bulunamadı");
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        name: normalizedName,
        phone: normalizedPhone,
      };

      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(responseData?.error || "Bir hata oluştu");
        return;
      }

      const updatedUser: User = {
        name: responseData?.user?.name ?? payload.name,
        email: responseData?.user?.email ?? user.email,
        phone: responseData?.user?.phone ?? payload.phone,
      };

      setUser(updatedUser);
      setInitialUser(updatedUser);
      toast.success("Profil güncellendi");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Ad Soyad
        </label>
        <Input
          value={user.name || ""}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
          className="h-11 border-gray-300 focus:border-black focus:ring-black rounded-lg"
          placeholder="Adınızı ve soyadınızı girin"
        />
        <p className="mt-1.5 text-xs text-gray-500 font-light">
          Hesabınızda görünecek adınız ve soyadınız.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          E-posta Adresi
        </label>
        <Input 
          value={user.email || ""} 
          disabled
          className="h-11 border-gray-300 bg-gray-50 rounded-lg cursor-not-allowed"
        />
        <p className="mt-1.5 text-xs text-gray-500 font-light">
          E-posta adresiniz değiştirilemez. Değiştirmek için lütfen destek ekibimizle iletişime geçin.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Telefon Numarası
        </label>
        <Input
          value={user.phone || ""}
          onChange={(e) => setUser({ ...user, phone: normalizePhoneInput(e.target.value) })}
          className="h-11 border-gray-300 focus:border-black focus:ring-black rounded-lg"
          placeholder="5XX XXX XX XX"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={user.phone?.startsWith("0") ? 11 : 10}
        />
        <p className="mt-1.5 text-xs text-gray-500 font-light">
          Sipariş ve teslimat bilgilendirmeleri için kullanılacaktır.
        </p>
      </div>

      <div className="pt-4">
        <Button 
          onClick={updateUser} 
          disabled={updating}
          className="h-11 px-8 bg-black text-white hover:bg-black/90 rounded-full text-sm font-light"
        >
          {updating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Güncelleniyor...</span>
            </div>
          ) : (
            "Değişiklikleri Kaydet"
          )}
        </Button>
      </div>
    </div>
  );
}
