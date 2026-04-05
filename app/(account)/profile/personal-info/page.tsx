"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import EmailVerifyNotice from "@/app/(account)/profile/EmailVerifyNotice";
import ProfileDetails from "@/app/(account)/profile/ProfileDetails";
import MarketingConsentToggle from "@/app/(account)/profile/MarketingConsentToggle";
import PasswordChange from "@/app/(account)/profile/PasswordChange";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Silme işlemi başarısız");
      toast.success("Hesabınız silindi.");
      router.push("/");
    } catch (err) {
      toast.error("Hesap silinemedi.");
    }
  };

  return (
    <div className="w-full">
      
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-black mb-2">
          Kişisel Bilgilerim
        </h1>
        <p className="text-sm text-gray-600 font-light">
          Hesap bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.
        </p>
      </div>

      
      <div className="flex items-center gap-1 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 text-sm font-light transition-colors relative ${
            activeTab === "profile"
              ? "text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Profil Detayları
          {activeTab === "profile" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-6 py-3 text-sm font-light transition-colors relative ${
            activeTab === "password"
              ? "text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Şifre Değiştirme
          {activeTab === "password" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
          )}
        </button>
      </div>

      
      <div className="mb-8">
        <EmailVerifyNotice />
      </div>

      
      <div className="max-w-2xl">
        {activeTab === "profile" && (
          <div className="space-y-8">
            <ProfileDetails />
            <div className="pt-6 border-t border-gray-200">
              <MarketingConsentToggle />
            </div>
          </div>
        )}

        {activeTab === "password" && (
          <div className="space-y-8">
            <PasswordChange />
          </div>
        )}

        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-black">Hesap İşlemleri</h3>
            <p className="text-xs text-gray-600 font-light">
              Hesabınızı kalıcı olarak silmek istiyorsanız aşağıdaki butona tıklayın.
              Bu işlem geri alınamaz.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="mt-4 text-sm text-red-600 hover:text-red-700 font-light underline">
                  Hesabı Sil
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Hesabınızı silmek istediğinize emin misiniz?
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount}>
                    Evet, Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
