import { Suspense } from "react";
import AuthTabs from "./_components/AuthTabs";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
        </div>
      }
    >
      <AuthTabs />
    </Suspense>
  );
}
