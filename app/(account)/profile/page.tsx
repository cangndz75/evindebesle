"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import EmailVerifyNotice from "./EmailVerifyNotice";
import ProfileDetails from "./ProfileDetails";
import MarketingConsentToggle from "./MarketingConsentToggle";
import PasswordChange from "./PasswordChange";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const { data: session } = useSession();
  const user = session?.user;

  const router = useRouter();

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Hesabınız silindi.");
      router.push("/");
    } catch {
      toast.error("Hesap silinemedi.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Kişisel Bilgiler</h1>
      <div className="flex space-x-4 mb-4 border-b">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-1 pb-2 text-sm font-medium transition-all ${
            activeTab === "profile"
              ? "border-b-2 border-black text-black font-semibold"
              : "text-gray-700 hover:text-black"
          }`}
          style={{ background: "none", borderRadius: 0 }}
        >
          Profil Detayları
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-1 pb-2 text-sm font-medium transition-all ${
            activeTab === "password"
              ? "border-b-2 border-black text-black font-semibold"
              : "text-gray-700 hover:text-black"
          }`}
          style={{ background: "none", borderRadius: 0 }}
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
      {activeTab === "profile" && (
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
      )}
    </div>
  );
}
