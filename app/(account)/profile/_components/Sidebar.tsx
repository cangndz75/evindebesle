"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const links = [
  { href: "/profile/personal-info", label: "Kişisel Bilgilerim" },
  { href: "/profile/pets", label: "Evcil Hayvanlarım" },
  { href: "/profile/addresses", label: "Adreslerim" },
  { href: "/profile/access-info", label: "Erişim Bilgilerim" },
  { href: "/profile/orders", label: "Randevularım" },
  { href: "/profile/coupons", label: "İndirim Kuponlarım" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const fullName = session?.user?.name || "Kullanıcı";
  const initials = fullName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-white font-bold text-xl">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-lg">{fullName}</p>
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
