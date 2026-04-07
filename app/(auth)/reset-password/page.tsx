import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";
import OnboardingSlides from "@/app/(public)/_components/OnboardingSlides";

export default function Page() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          </div>
        }
      >
        <ResetPasswordClient />
      </Suspense>

      <div className="hidden lg:block fixed right-0 top-0 h-full w-1/2">
        <OnboardingSlides />
      </div>
    </>
  );
}
