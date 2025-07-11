"use client";

import { Suspense } from "react";
import VerifyRequest from "./verify-request-content";

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Yükleniyor...</div>}>
      <VerifyRequest />
    </Suspense>
  );
}
