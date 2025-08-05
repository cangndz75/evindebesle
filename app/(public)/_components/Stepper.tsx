"use client";

import clsx from "clsx";

type StepperProps = {
  activeStep: number;
};

export default function Stepper({ activeStep }: StepperProps) {
  const steps = [
    { id: 1, label: "Hizmet Seçimi" },
    { id: 2, label: "Tarih Seçimi" },
    { id: 3, label: "Ödeme Planı" },
  ];

  return (
    <div className="w-full px-4 py-6 flex justify-center">
      <div className="bg-white shadow-sm rounded-xl px-6 py-4 w-full max-w-[680px] flex items-center justify-between gap-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={clsx(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
                activeStep === step.id
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {step.id}
            </div>
            <span
              className={clsx(
                "text-sm font-medium",
                activeStep === step.id ? "text-black" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
