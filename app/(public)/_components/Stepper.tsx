"use client";

import clsx from "clsx";

type StepperProps = {
  activeStep: number;
};

const steps = ["Hizmet Seçimi", "Tarih Seçimi", "Ödeme Planı"];

export default function Stepper({ activeStep }: StepperProps) {
  return (
    <div className="w-full px-4 py-4 flex overflow-x-auto gap-6">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2 flex-shrink-0">
          <div
            className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              activeStep === index + 1
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-500"
            )}
          >
            {index + 1}
          </div>
          <span
            className={clsx(
              "text-sm font-medium whitespace-nowrap",
              activeStep === index + 1 ? "text-black" : "text-muted-foreground"
            )}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div className="w-6 h-px bg-gray-300 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}
