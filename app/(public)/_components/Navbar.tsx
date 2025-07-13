"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LogOut, User, PawPrint, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

        {/* Masaüstü menü */}
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

        {/* Mobil Hamburger Menü */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menü</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-4 text-sm">
                <Link href="/about">Hakkımızda</Link>
                <Link href="/services">Hizmetler</Link>
                <Link href="/contact">İletişim</Link>
                <Separator />
                {session?.user ? (
                  <>
                    <Link href="/profile">Profilim</Link>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-1" />
                      Çıkış Yap
                    </Button>
                  </>
                ) : (
                  <Link href="/login">
                    <Button>
                      <User className="w-4 h-4 mr-1" />
                      Giriş Yap
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Masaüstü sağ alan */}
        {status === "loading" ? null : (
          <div className="hidden md:flex items-center gap-4">
            {session?.user ? (
              <>
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
              </>
            ) : (
              <Link href="/login">
                <Button>
                  <User className="w-4 h-4 mr-1" />
                  Giriş Yap
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
