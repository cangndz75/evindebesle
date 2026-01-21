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

export default function ProfileDetails() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();
        setUser(data);
      } catch {
        toast.error("Kullanıcı bilgileri alınamadı");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const updateUser = async () => {
    setUpdating(true);
    const res = await fetch("/api/user/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    setUpdating(false);

    if (res.ok) toast.success("Profil güncellendi");
    else toast.error("Bir hata oluştu");
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
          onChange={(e) => setUser({ ...user, phone: e.target.value })}
          className="h-11 border-gray-300 focus:border-black focus:ring-black rounded-lg"
          placeholder="5XX XXX XX XX"
          type="tel"
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
