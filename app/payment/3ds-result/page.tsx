import { Suspense } from "react";
import Payment3DSResultClient from "./Payment3DSResultClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Yükleniyor...</div>}>
      <Payment3DSResultClient />
    </Suspense>
  );
}
