"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Step1Form from "./Step1Form";
import Step2Form from "./Step2Form";
import Step3Client from "../step3/Step3Client";
import SummarySidebar from "./SummarySidebar";

export default function MultiStepClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<any>({
    selectedSpecies: [],
    selectedUserPetsBySpecies: {},
    selectedServices: [],
    services: [],
    petTypes: [],
    address: null,
    dateRange: null,
    dates: [],
    timeSlot: "",
    repeatType: "none",
    repeatCount: null,
    appliedCoupon: null,
    draftAppointmentId: null,
  });

  const handleNext = () => setStep((p) => p + 1);
  const handleBack = () => setStep((p) => p - 1);

  useEffect(() => {
    if (formData?.draftAppointmentId && step !== 3) setStep(3);
  }, [formData?.draftAppointmentId, step]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-8">
        {step === 1 && (
          <Step1Form formData={formData} setFormData={setFormData} onNext={handleNext} />
        )}
        {step === 2 && (
          <Step2Form formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />
        )}
      </div>
      <div className="md:col-span-1">
        <SummarySidebar formData={formData} />
      </div>
    </div>
  );
}
