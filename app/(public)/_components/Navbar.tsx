"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  LogOut,
  User,
  PawPrint,
  Menu,
  Info,
  Briefcase,
  Phone,
} from "lucide-react";
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

        <div className="md:hidden flex items-center gap-2">
          {session?.user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <Link href="/auth-tabs">
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-1" />
                Giriş Yap
              </Button>
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-4">
              <SheetHeader>
                <SheetTitle className="sr-only">Menü</SheetTitle>
              </SheetHeader>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/logo.png" />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {status === "loading" ? (
                    <span className="font-medium text-sm text-gray-400">
                      Yükleniyor...
                    </span>
                  ) : (
                    <span className="font-medium text-sm text-gray-900">
                      {session?.user?.name ?? "Misafir"}
                    </span>
                  )}
                </div>
                {session?.user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-4 text-sm text-gray-800">
                {/* <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:text-primary transition"
                >
                  <Info className="w-4 h-4" />
                  Profilim
                </Link> */}
                <Link
                  href="/about"
                  className="flex items-center gap-2 hover:text-primary transition"
                >
                  <Info className="w-4 h-4" />
                  Hakkımızda
                </Link>
                <Link
                  href="/services"
                  className="flex items-center gap-2 hover:text-primary transition"
                >
                  <Briefcase className="w-4 h-4" />
                  Hizmetler
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 hover:text-primary transition"
                >
                  <Phone className="w-4 h-4" />
                  İletişim
                </Link>
              </div>

              <Separator className="my-4" />

              <div className="text-sm text-gray-800">
                {session?.user ? (
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 hover:text-primary transition"
                  >
                    <User className="w-4 h-4" />
                    Profilim
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 hover:text-primary transition"
                  >
                    <User className="w-4 h-4" />
                    Giriş Yap
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

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
