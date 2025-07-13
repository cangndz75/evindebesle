import { Suspense } from "react";
import Step2Client from "./Step2Client";

export default function Step2Page() {
  return (
    <Suspense fallback={<div className="p-10">Yükleniyor...</div>}>
      <Step2Client />
    </Suspense>
  );
}