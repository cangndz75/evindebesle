import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-9 w-9 rounded-full border-2 border-black/20 border-t-black animate-spin" />
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
