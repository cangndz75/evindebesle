"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LogOut, User, PawPrint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Çıkış yapıldı");
    router.push("/");
  };

  return (
    <nav className="w-full border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/home"
          className="flex items-center gap-2 text-xl font-bold text-primary"
        >
          <PawPrint className="w-6 h-6 text-violet-700" />
          EvindeBesle
        </Link>

        {/* Sayfa linkleri */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/about" className="hover:text-black transition">
            Hakkımızda
          </Link>
          <Link href="/services" className="hover:text-black transition">
            Hizmetler
          </Link>
          <Link href="/contact" className="hover:text-black transition">
            İletişim
          </Link>
        </div>

        {/* Sağ kısım */}
        {status === "loading" ? null : session?.user ? (
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/logo.png" />
                  <AvatarFallback>
                    {session.user.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {session.user.name}
                </span>
              </Button>
            </Link>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              Çıkış
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button variant="default">
              <User className="w-4 h-4 mr-1" />
              Giriş Yap
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
