import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-20">Yükleniyor...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
