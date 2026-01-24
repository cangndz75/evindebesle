"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CampaignComposerPage from "./_components/CampaignComposerPage";
import { toast } from "sonner";

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (status === "loading") return;

      if (!session) {
        toast.error("Giriş yapmanız gerekiyor");
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          if (!user || !user.isAdmin) {
            toast.error("Bu sayfaya erişim yetkiniz yok");
            router.push("/dashboard");
            return;
          }
          setIsAdmin(true);
        } else {
          toast.error("Kullanıcı bilgileri alınamadı");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error checking admin:", error);
        toast.error("Bir hata oluştu");
        router.push("/dashboard");
      }
    };

    checkAdmin();
  }, [session, status, router]);

  if (status === "loading" || isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <CampaignComposerPage />;
}
