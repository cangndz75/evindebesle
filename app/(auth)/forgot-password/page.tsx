import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";
import OnboardingSlides from "@/app/(public)/_components/OnboardingSlides";

export default function Page() {
  return (
    <>
      <Suspense
        fallback={<div className="text-center py-20">Yükleniyor...</div>}
      >
        <ForgotPasswordClient />
      </Suspense>

      <div className="hidden lg:block fixed right-0 top-0 h-full w-1/2">
        <OnboardingSlides />
      </div>
    </>
  );
}
