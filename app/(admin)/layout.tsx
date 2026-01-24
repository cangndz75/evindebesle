"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  Menu,
  X,
  Home,
  User,
  PawPrint,
  List,
  Briefcase,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  ChevronLeft,
  Scissors,
  MapPin,
  Building,
  HelpCircle,
  FileText,
  Ticket,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const navSections = [
  {
    title: "ANA MENÜ",
    links: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <Home className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "OPERASYONLAR",
    links: [
      {
        label: "Siparişler",
        href: "/admin-orders",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        label: "Stok Yönetimi",
        href: "/admin-stock",
        icon: <Package className="w-5 h-5" />,
      },
      {
        label: "Randevular",
        href: "/admin-appointments",
        icon: <List className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "KATALOG",
    links: [
      {
        label: "Ürünler",
        href: "/admin-products",
        icon: <Package className="w-5 h-5" />,
      },
      {
        label: "Hizmetler",
        href: "/admin-services",
        icon: <Scissors className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "PAZARLAMA",
    links: [
      {
        label: "Kuponlar",
        href: "/coupons",
        icon: <Ticket className="w-5 h-5" />,
      },
      {
        label: "Mail Gönder",
        href: "/campaigns",
        icon: <Mail className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "MÜŞTERİ & DESTEK",
    links: [
      {
        label: "Müşteriler",
        href: "/admin-customers",
        icon: <User className="w-5 h-5" />,
      },
      {
        label: "Evcil Hayvanlar",
        href: "/admin-pets",
        icon: <PawPrint className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "RAPORLAMA",
    links: [
      {
        label: "Raporlar",
        href: "/admin-reports",
        icon: <FileText className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "AYARLAR",
    links: [
      {
        label: "Hizmet Adresleri",
        href: "/admin-addresses",
        icon: <MapPin className="w-5 h-5" />,
      },
      {
        label: "Firma Yönetimi",
        href: "/company-settings",
        icon: <Building className="w-5 h-5" />,
      },
      {
        label: "Destek Merkezi",
        href: "/support",
        icon: <HelpCircle className="w-5 h-5" />,
      },
      {
        label: "Dokümantasyon",
        href: "/docs",
        icon: <FileText className="w-5 h-5" />,
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Çıkış yapıldı");
    router.push("/home");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col shrink-0">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5" />
            <h2 className="text-xl font-bold">Evinde Besle</h2>
            <ChevronLeft className="w-4 h-4 ml-auto" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.links.map(({ label, href, icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={`${section.title}-${label}-${href}`}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {icon}
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold mb-3">
            AD
          </div>
          <Button
            variant="ghost"
            className="w-full text-sm text-gray-300 hover:text-white hover:bg-gray-800"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 w-full z-50 bg-white border-b border-border flex items-center justify-between px-4 py-3">
        <h2 className="text-xl font-bold">Evinde Besle</h2>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-gray-900 text-white p-6 space-y-6 pt-20 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <Home className="w-5 h-5" />
            <h2 className="text-xl font-bold">Evinde Besle</h2>
          </div>
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <nav className="space-y-2">
                {section.links.map(({ label, href, icon }) => (
                  <Link
                    key={`${section.title}-${label}-${href}`}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-base hover:bg-gray-800 transition-colors"
                  >
                    {icon}
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
          <Button
            variant="ghost"
            className="w-full mt-6 flex gap-2 justify-center text-base text-gray-300 hover:text-white hover:bg-gray-800"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </Button>
        </div>
      )}

      <main className="flex-1 bg-gray-50 overflow-y-auto">{children}</main>
    </div>
  );
}
