import { Suspense } from "react";
import Step3Client from "./Step3Client";

export default function Step3Page() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <Step3Client />
    </Suspense>
  );
}
