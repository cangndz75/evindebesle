import type { ReactNode } from "react";
import Navbar from "../_components/Navbar";

export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
