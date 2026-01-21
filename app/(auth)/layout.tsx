"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isVerifyPage = pathname.includes("/verify-request");

  return (
    <SessionProvider>
      {isVerifyPage ? (
        <div className="flex items-center justify-center min-h-screen bg-white px-4">
          {children}
        </div>
      ) : (
        <div className="h-screen overflow-hidden bg-white">
          {children}
        </div>
      )}
    </SessionProvider>
  );
}
