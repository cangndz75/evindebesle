import type { ReactNode } from "react"
import Sidebar from "./_components/Sidebar"
import ProfileMobileHeader from "./_components/ProfileMobileHeader"
import Navbar from "../(public)/_components/Navbar"

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-white">
        <aside className="hidden md:block w-64 border-r bg-gray-50 px-4 py-6">
          <Sidebar />
        </aside>
        <main className="flex-1 px-4 md:px-10 py-6 space-y-4">
          <ProfileMobileHeader />
          {children}
        </main>
      </div>
    </>
  )
}
