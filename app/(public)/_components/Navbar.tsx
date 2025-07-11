"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Çıkış yapıldı");
    router.push("/");
  };

  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center border-b">
      <Link href="/" className="text-xl font-bold">
        EvindeBesle
      </Link>

      {status === "loading" ? null : session?.user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {session.user.name}
          </span>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Çıkış
          </Button>
        </div>
      ) : (
        <Link href="/login">
          <Button variant="default">
            <User className="w-4 h-4 mr-1" /> Giriş Yap
          </Button>
        </Link>
      )}
    </nav>
  );
}
