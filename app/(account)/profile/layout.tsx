import type { ReactNode } from "react";
import Navbar from "@/app/(public)/_components/Navbar";
import Sidebar from "@/app/(account)/profile/_components/Sidebar";
import ProfileMobileHeader from "@/app/(account)/profile/_components/ProfileMobileHeader";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex flex-col md:flex-row min-h-screen bg-white overflow-x-hidden">
        <aside className="hidden md:block w-64 border-r bg-gray-50 px-4 py-6 shrink-0">
          <Sidebar />
        </aside>

        <main className="flex-1 w-full max-w-full px-4 md:px-10 py-6">
          <ProfileMobileHeader />
          <div className="mt-4">{children}</div>
        </main>
      </div>
    </>
  );
}
