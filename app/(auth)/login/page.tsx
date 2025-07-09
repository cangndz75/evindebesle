'use client'

import FlipCard from "@/app/(public)/_components/FlipCard"
import OnboardingSlides from "@/app/(public)/_components/OnboardingSlides"

export default function LoginPage() {
  return (
    <>
      <div className="flex items-center justify-center w-full bg-white">
        <FlipCard />
      </div>
      <div className="hidden md:flex items-center justify-center w-full bg-muted">
        <OnboardingSlides />
      </div>
    </>
  );
}
