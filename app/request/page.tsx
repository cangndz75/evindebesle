import { Suspense } from "react";
import MultiStepPage from "./multistep/page";

export default function Page() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <MultiStepPage />
    </Suspense>
  );
}
