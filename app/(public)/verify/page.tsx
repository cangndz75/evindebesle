import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-10">Doğrulama yapılıyor...</div>}>
      <VerifyClient />
    </Suspense>
  );
}
