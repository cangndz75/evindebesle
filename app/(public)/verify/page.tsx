import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-lg text-muted-foreground">
          Doğrulama sayfası yükleniyor...
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
