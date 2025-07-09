import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold text-teal-600 flex items-center gap-2">
            {/* <img src="/logo.svg" alt="Logo" className="h-6 w-6" /> */}
            EvindeBesle
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-800">
            <Link href="#">link 1</Link>
            {/* <Link href="#">Find a house sit</Link> */}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="#" className="text-gray-800 hover:underline">Nasıl Çalışır</Link>
          <Link href="#" className="text-gray-800 hover:underline">Yardım</Link>
          <Link href="#" className="text-violet-700 hover:underline">Giriş Yap</Link>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            Kayıt Ol
          </Button>
        </div>
      </div>
    </header>
  );
}
