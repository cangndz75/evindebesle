"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronRight } from "lucide-react";

const links = [
  { href: "/profile/personal-info", label: "Kişisel Bilgilerim" },
  { href: "/profile/addresses", label: "Adreslerim" },
  { href: "/profile/orders", label: "Siparişlerim" },
  { href: "/profile/support", label: "Destek Taleplerim" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const fullName = session?.user?.name || "Kullanıcı";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/auth-tabs";
  };

  return (
    <div className="space-y-8">
      
      <div>
        <p className="text-base font-light text-black mb-4">{fullName}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-light text-red-600 hover:text-red-700 transition-colors group"
        >
          <span>Çıkış yap</span>
          <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      
      <nav className="space-y-1">
        <div className="mb-4">
          <h3 className="text-xs font-medium text-black uppercase tracking-wider mb-3">
            Kişisel Bilgilerim
          </h3>
          <div className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center justify-between px-0 py-2 text-sm font-light transition-colors ${isActive
                      ? "text-black"
                      : "text-gray-600 hover:text-black"
                    }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-black" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
