import Link from "next/link"
import { Button } from "@/components/ui/button"
import "@/app/globals.css"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 bg-white border-r border-border p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-8">TechCorp</h2>
          <nav className="space-y-4">
            {[
              { label: "Anasayfa", href: "/dashboard" },
              { label: "Kullanıcılar", href: "/users" },
              { label: "Evcil Hayvanlar", href: "/pets" },
              { label: "Siparişler", href: "/security" },
              { label: "Hizmetler", href: "/activity" },
              { label: "Abonelikler", href: "/database" },
              // { label: "Performance", href: "/performance" },
              // { label: "Notifications", href: "/notifications" },
              { label: "Settings", href: "/settings" },
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
          <Button variant="outline" className="w-full text-sm">
            Light Mode
          </Button>
          <Button variant="secondary" className="w-full text-sm">
            Admin Profile
          </Button>
        </div>
      </aside>

      {/* Sağ taraf = içerik burada değişir */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
