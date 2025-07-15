"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import clsx from "clsx";

const tabs = [
  { label: "Kişisel Bilgilerim", href: "/profile/personal-info" },
  { label: "Favorilerim", href: "/profile/favorites" },
  { label: "Siparişlerim", href: "/profile/orders" },
  { label: "İndirim Kuponlarım", href: "/profile/coupons" },
];

export default function ProfileMobileHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Çıkış yapıldı");
    router.push("/");
  };

  return (
    <div className="md:hidden space-y-4 border-b bg-white pb-4">
      <div className="flex items-center justify-between px-4 pt-2">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback>
              {session?.user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold">{session?.user?.name}</span>
        </div>
        <Button variant="link" size="sm" onClick={handleLogout}>
          Çıkış Yap
        </Button>
      </div>
      <div className="overflow-x-auto no-scrollbar px-4 -mx-4">
        <div className="flex gap-3 min-w-[500px] max-w-none">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition",
                pathname === tab.href
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
