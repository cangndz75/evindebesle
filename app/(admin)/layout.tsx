"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import "@/app/globals.css";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Çıkış yapıldı");
    router.push("/home");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 bg-white border-r border-border p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-8">Evinde Besle</h2>
          <nav className="space-y-4">
            {[
              { label: "Anasayfa", href: "/admin/dashboard" },
              { label: "Kullanıcılar", href: "/admin/users" },
              { label: "Evcil Hayvanlar", href: "/admin/pets" },
              { label: "Siparişler", href: "/admin/security" },
              { label: "Hizmetler", href: "/admin/activity" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="block text-sm hover:text-primary transition"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full text-sm"
            onClick={handleLogout}
          >
            Çıkış Yap
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
