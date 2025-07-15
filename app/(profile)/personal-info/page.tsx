"use client";

import { useState } from "react";
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
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Kişisel Bilgiler</h1>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === "profile" ? "bg-black text-white" : "bg-gray-100 text-gray-800"}`}
        >
          Profil Detayları
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === "password" ? "bg-black text-white" : "bg-gray-100 text-gray-800"}`}
        >
          Şifre Değiştirme
        </button>
      </div>

      <EmailVerifyNotice />

      {activeTab === "profile" && (
        <>
          <ProfileDetails />
          <MarketingConsentToggle />
        </>
      )}

      {activeTab === "password" && <PasswordChange />}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="mt-6 text-sm text-red-600 hover:underline">
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
  );
}
