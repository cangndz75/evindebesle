"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type User = {
  name: string;
  email: string;
  phone: string;
};

export default function ProfileDetails() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchUser = async () => {
    const res = await fetch("/api/user/me");
    const data = await res.json();
    setUser(data);
    setLoading(false);
  };

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

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading || !user) return <p>Yükleniyor...</p>;

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
        {updating ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  );
}
