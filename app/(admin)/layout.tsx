"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Menu,
  X,
  Home,
  User,
  List,
  Briefcase,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Scissors,
  MapPin,
  Building,
  HelpCircle,
  FileText,
  Ticket,
  Mail,
  Users,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { AdminNotificationBell } from "./_components/AdminNotificationBell";

const navSections = [
  {
    title: "ANA MENÃœ",
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
        label: "SipariÅŸler",
        href: "/admin-orders",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        label: "Stok YÃ¶netimi",
        href: "/admin-stock",
        icon: <Package className="w-5 h-5" />,
      },
      {
        label: "Faturalar",
        href: "/admin-invoices",
        icon: <FileText className="w-5 h-5" />,
      },
      {
        label: "Ä°ÅŸlemler",
        href: "/admin-transactions",
        icon: <Briefcase className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "KATALOG",
    links: [
      {
        label: "ÃœrÃ¼nler",
        href: "/admin-products",
        icon: <Package className="w-5 h-5" />,
      },
      {
        label: "Kategoriler",
        href: "/admin-categories",
        icon: <List className="w-5 h-5" />,
      },
      {
        label: "ÃœrÃ¼n ÅablonlarÄ±",
        href: "/admin-product-templates",
        icon: <FileText className="w-5 h-5" />,
      },
      {
        label: "ÃœrÃ¼n Kombinleri",
        href: "/admin-product-combinations",
        icon: <Package className="w-5 h-5" />,
      },
      {
        label: "Excel Import",
        href: "/admin-products/import",
        icon: <Upload className="w-5 h-5" />,
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
        label: "Mail GÃ¶nder",
        href: "/campaigns",
        icon: <Mail className="w-5 h-5" />,
      },
      {
        label: "Kampanya Listesi",
        href: "/email-campaigns",
        icon: <Mail className="w-5 h-5" />,
      },
      {
        label: "BÃ¼lten Aboneleri",
        href: "/admin-subscribers",
        icon: <Users className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "ANA SAYFA & UI YÃ–NETÄ°MÄ°",
    links: [
      {
        label: "Ana Sayfa Vitrin",
        href: "/admin-product-showcase",
        icon: <Package className="w-5 h-5" />,
      },
      {
        label: "Sekmeli KaydÄ±rÄ±cÄ±lar",
        href: "/admin-tabbed-carousel",
        icon: <List className="w-5 h-5" />,
      },
      {
        label: "Koleksiyonlar",
        href: "/admin-collections",
        icon: <Package className="w-5 h-5" />,
      },
      {
        label: "Yeni Gelenler ModÃ¼lÃ¼",
        href: "/admin-new-arrivals",
        icon: <List className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "Ä°Ã‡ERÄ°K YÃ–NETÄ°MÄ°",
    links: [
      {
        label: "Blog YazÄ±larÄ±",
        href: "/admin-blog",
        icon: <FileText className="w-5 h-5" />,
      },
      {
        label: "SSS YÃ¶netimi",
        href: "/admin-faq",
        icon: <FileText className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "MÃœÅTERÄ° & DESTEK",
    links: [
      {
        label: "MÃ¼ÅŸteriler",
        href: "/admin-customers",
        icon: <User className="w-5 h-5" />,
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
        label: "Firma YÃ¶netimi",
        href: "/company-settings",
        icon: <Building className="w-5 h-5" />,
      },
      {
        label: "Destek Merkezi",
        href: "/admin-support",
        icon: <HelpCircle className="w-5 h-5" />,
      },
      {
        label: "DokÃ¼mantasyon",
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
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isCampaignsPage = pathname === "/campaigns";

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/auth-tabs");
      return;
    }

    if (!session.user?.isAdmin) {
      router.replace("/home");
      return;
    }
  }, [session, status, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Ã‡Ä±kÄ±ÅŸ yapÄ±ldÄ±");
    router.push("/home");
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`hidden md:flex bg-gray-900 text-white flex-col shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"
        }`}>
        <div className={`border-b border-gray-800 ${sidebarCollapsed ? "p-3" : "p-6"}`}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-xl font-bold whitespace-nowrap flex-1">Dark Velvet</h2>
              <AdminNotificationBell />
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="flex-shrink-0 p-1 hover:bg-gray-800 rounded transition-colors"
                title="Daralt"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Home className="w-5 h-5 flex-shrink-0" />
              <AdminNotificationBell />
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center justify-center p-1.5 hover:bg-gray-800 rounded transition-colors"
                title="GeniÅŸlet"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                  {section.title}
                </h3>
              )}
              <nav className="space-y-1">
                {section.links.map(({ label, href, icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={`${section.title}-${label}-${href}`}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${sidebarCollapsed ? "justify-center" : ""
                        } ${isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                      title={sidebarCollapsed ? label : undefined}
                    >
                      <span className="flex-shrink-0">{icon}</span>
                      {!sidebarCollapsed && <span className="whitespace-nowrap">{label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800">
          {!sidebarCollapsed && (
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold mb-3">
              AD
            </div>
          )}
          <Button
            variant="ghost"
            className={`w-full text-sm text-gray-300 hover:text-white hover:bg-gray-800 ${sidebarCollapsed ? "justify-center px-0" : ""
              }`}
            onClick={handleLogout}
            title={sidebarCollapsed ? "Ã‡Ä±kÄ±ÅŸ Yap" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-2">Ã‡Ä±kÄ±ÅŸ Yap</span>}
          </Button>
        </div>
      </aside>

      {!isCampaignsPage && (
        <div className="md:hidden fixed top-0 left-0 w-full z-50 bg-white border-b border-border flex items-center justify-between px-4 py-3">
          <h2 className="text-xl font-bold">Dark Velvet</h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 bg-gray-900 text-white p-6 space-y-6 pt-20 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <Home className="w-5 h-5" />
            <h2 className="text-xl font-bold">Dark Velvet</h2>
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
            Ã‡Ä±kÄ±ÅŸ Yap
          </Button>
        </div>
      )}

      <main className={`flex-1 bg-gray-50 relative ${isCampaignsPage ? "overflow-hidden" : "overflow-y-auto"
        }`}>{children}</main>
    </div>
  );
}
