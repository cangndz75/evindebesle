"use client";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Menu,
  User,
  PawPrint,
  Briefcase,
  Home,
  List,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function AdminMobileMenu({ name }: { name?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Çıkış yapıldı");
    router.push("/home");
  };

  return (
    <div className="md:hidden flex items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg">
              <PawPrint className="w-5 h-5 text-violet-700" />
              Evinde Besle
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-3 mt-6 mb-6">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/admin.png" />
              <AvatarFallback>{name?.charAt(0) ?? "A"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-800">
              {name ?? "Admin"}
            </span>
          </div>

          <div className="flex flex-col gap-4 text-sm text-gray-800">
            <Link href="/dashboard" className="flex items-center gap-2 hover:text-primary">
              <Home className="w-4 h-4" />
              Anasayfa
            </Link>
            <Link href="/users" className="flex items-center gap-2 hover:text-primary">
              <User className="w-4 h-4" />
              Kullanıcılar
            </Link>
            <Link href="/pets" className="flex items-center gap-2 hover:text-primary">
              <PawPrint className="w-4 h-4" />
              Evcil Hayvanlar
            </Link>
            <Link href="/security" className="flex items-center gap-2 hover:text-primary">
              <List className="w-4 h-4" />
              Siparişler
            </Link>
            <Link href="/activity" className="flex items-center gap-2 hover:text-primary">
              <Briefcase className="w-4 h-4" />
              Hizmetler
            </Link>
          </div>

          <Separator className="my-4" />

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full text-sm flex gap-2"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
