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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Ad</label>
        <Input
          value={user.name || ""}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">E-posta</label>
        <Input value={user.email || ""} disabled />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Telefon</label>
        <Input
          value={user.phone || ""}
          onChange={(e) => setUser({ ...user, phone: e.target.value })}
        />
      </div>

      <Button onClick={updateUser} disabled={updating}>
        {updating ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          "Kaydet"
        )}
      </Button>
    </div>
  );
}
