import { Suspense } from "react";
import Payment3DSResultClient from "./Payment3DSResultClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
        </div>
      }
    >
      <Payment3DSResultClient />
    </Suspense>
  );
}
