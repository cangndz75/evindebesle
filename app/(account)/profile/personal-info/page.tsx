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

      if (!res.ok) throw new Error("Silme iÅŸlemi baÅŸarÄ±sÄ±z");
      toast.success("HesabÄ±nÄ±z silindi.");
      router.push("/");
    } catch (err) {
      toast.error("Hesap silinemedi.");
    }
  };

  return (
    <div className="w-full">
      {/* BaÅŸlÄ±k */}
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-black mb-2">
          KiÅŸisel Bilgilerim
        </h1>
        <p className="text-sm text-gray-600 font-light">
          Hesap bilgilerinizi ve ÅŸifrenizi buradan gÃ¼ncelleyebilirsiniz.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 text-sm font-light transition-colors relative ${
            activeTab === "profile"
              ? "text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Profil DetaylarÄ±
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
          Åifre DeÄŸiÅŸtirme
          {activeTab === "password" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
          )}
        </button>
      </div>

      {/* Email Verification Notice */}
      <div className="mb-8">
        <EmailVerifyNotice />
      </div>

      {/* Content */}
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

        {/* Delete Account */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-black">Hesap Ä°ÅŸlemleri</h3>
            <p className="text-xs text-gray-600 font-light">
              HesabÄ±nÄ±zÄ± kalÄ±cÄ± olarak silmek istiyorsanÄ±z aÅŸaÄŸÄ±daki butona tÄ±klayÄ±n.
              Bu iÅŸlem geri alÄ±namaz.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="mt-4 text-sm text-red-600 hover:text-red-700 font-light underline">
                  HesabÄ± Sil
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    HesabÄ±nÄ±zÄ± silmek istediÄŸinize emin misiniz?
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>VazgeÃ§</AlertDialogCancel>
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
