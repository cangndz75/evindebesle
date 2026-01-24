import type { ReactNode } from "react";

export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div className="w-full bg-white">
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
