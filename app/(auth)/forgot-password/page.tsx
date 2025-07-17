import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-20">Yükleniyor...</div>}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
