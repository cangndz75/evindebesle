"use client";

import { useEffect, useState } from "react";
import { MapPin, Mail, Phone, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type AppointmentUserData = {
  user: {
    name: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
};

export default function AppointmentUserInfoCard({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [userData, setUserData] = useState<AppointmentUserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/admin/appointments/${appointmentId}`);
        const json = await res.json();
        setUserData(json?.data || null);
      } catch (err) {
        console.error("Kullanıcı bilgisi alınamadı", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="border rounded-lg p-6 shadow-sm bg-white space-y-4 animate-pulse">
        <div className="h-5 w-1/2 bg-gray-200 rounded" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-36 h-3 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-32 bg-gray-100 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-3 w-40 bg-gray-100 rounded" />
        </div>
        <div className="h-8 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!userData) return null;

  const { user } = userData;

  return (
    <div className="border rounded-lg p-6 shadow-sm bg-white space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <UserRound className="w-5 h-5" />
        Kullanıcı Bilgileri
      </h2>

      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src="" />
          <AvatarFallback>
            {user.name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{user.name || "Bilinmiyor"}</p>
          {user.email && (
            <p className="text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{user.address || "Adres bilgisi yok"}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{user.phone}</span>
          </div>
        )}
        {user.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
        )}
      </div>

      <Button className="w-full" disabled>
        Kullanıcı Kaydını Görüntüle
      </Button>
    </div>
  );
}
