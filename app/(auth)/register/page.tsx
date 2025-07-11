"use client";

import OnboardingSlides from "@/app/(public)/_components/OnboardingSlides";
import RegisterForm from "@/app/(public)/_components/RegisterForm";

export default function LoginPage() {
  return (
    <>
      <div className="flex items-center justify-center w-full bg-white">
        <RegisterForm />
      </div>
      <div className="hidden md:flex items-center justify-center w-full bg-muted">
        <OnboardingSlides />
      </div>
    </>
  );
}
