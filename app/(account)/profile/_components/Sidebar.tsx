"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

const links = [
  { href: "/profile/personal-info", label: "Kişisel Bilgilerim" },
  { href: "/profile/pets", label: "Evcil Hayvanlarım" },
  { href: "/profile/addresses", label: "Adreslerim" },
  { href: "/profile/orders", label: "Randevularım" },
  { href: "/price-alerts", label: "Fiyat Alarmı" },
  { href: "/stock-alerts", label: "Stok Habercim" },
  { href: "/coupons", label: "İndirim Kuponlarım" },
  { href: "/notifications", label: "Bildirimlerim" },
  { href: "/smart-match", label: "Smart Match Sonucu" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-white font-bold text-xl">
          CG
        </div>
        <div>
          <p className="font-semibold text-lg">Can Gündüz</p>
          <Link
            href="/logout"
            className="text-sm text-gray-500 hover:underline"
          >
            Çıkış Yap
          </Link>
        </div>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex justify-between items-center px-3 py-2 rounded-md transition-all 
              ${isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <span>{link.label}</span>
              {isActive && (
                <span className="text-blue-600 font-bold">&gt;</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
