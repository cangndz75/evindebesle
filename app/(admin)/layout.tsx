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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  {
    label: "Anasayfa",
    href: "/dashboard",
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: "Kullanıcılar",
    href: "/users",
    icon: <User className="w-5 h-5" />,
  },
  {
    label: "Evcil Hayvanlar",
    href: "/admin-pets",
    icon: <PawPrint className="w-5 h-5" />,
  },
  {
    label: "Siparişler",
    href: "/security",
    icon: <List className="w-5 h-5" />,
  },
  {
    label: "Hizmetler",
    href: "/admin-services",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    label: "İndirim Kuponları",
    href: "/coupons",
    icon: <List className="w-5 h-5" />,
  },
  {
    label: "Hizmet Adresleri",
    href: "/admin-addresses",
    icon: <List className="w-5 h-5" />,
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Çıkış yapıldı");
    router.push("/home");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <aside className="hidden md:flex w-64 bg-white border-r border-border p-6 flex-col justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold mb-8">Evinde Besle</h2>
          <nav className="space-y-4">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 text-sm hover:text-primary transition"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <Button
          variant="secondary"
          className="w-full text-sm"
          onClick={handleLogout}
        >
          Çıkış Yap
        </Button>
      </aside>

      <div className="md:hidden fixed top-0 left-0 w-full z-50 bg-white border-b border-border flex items-center justify-between px-4 py-3">
        <h2 className="text-xl font-bold">Evinde Besle</h2>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-white p-6 space-y-5 pt-20">
          <nav className="space-y-4">
            {navLinks.map(({ label, href, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-lg font-medium hover:text-primary transition"
              >
                {icon}
                {label}
              </Link>
            ))}
          </nav>

          <Button
            variant="outline"
            className="w-full mt-6 flex gap-2 justify-center text-base"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </Button>
        </div>
      )}

      <main className="flex-1 p-8 pt-[70px] md:pt-8 w-full">{children}</main>
    </div>
  );
}
