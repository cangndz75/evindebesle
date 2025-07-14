import { Suspense } from "react";
import Step1Client from "./Step1Client";

export default function Step1Page() {
  return (
    <Suspense fallback={<div className="p-10">Yükleniyor...</div>}>
      <Step1Client />
    </Suspense>
  );
}