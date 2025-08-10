import { Suspense } from "react";
import MultiStepClient from "./MultiStepClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Yükleniyor…</div>}>
      <MultiStepClient />
    </Suspense>
  );
}
