"use client";

import { useEffect } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";

/**
 * JWT geçersiz olsa bile istemci bazen kısa süre "authenticated" kalabiliyor;
 * kullanıcı DB'de yoksa oturumu kapatır.
 */
function StaleSessionClear() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.id) return;
    void signOut({ callbackUrl: "/auth-tabs" });
  }, [status, session?.user?.id]);

  return null;
}

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StaleSessionClear />
      {children}
    </SessionProvider>
  );
}
