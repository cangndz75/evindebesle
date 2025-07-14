import { Suspense } from "react";
import Step1Page from "./step1/page";

export default function Page() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <Step1Page />
    </Suspense>
  );
}
