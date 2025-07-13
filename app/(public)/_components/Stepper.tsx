"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";

const steps = [
  { label: "Step One", desc: "Pet seçimi", path: "/request" },
  { label: "Step Two", desc: "Hizmet & Adres", path: "/request/step2" },
  { label: "Step Three", desc: "Özet", path: "/request/step3" },
];

export default function Stepper() {
  const pathname = usePathname();
  const currentStep = steps.findIndex((step) => pathname.startsWith(step.path));

  return (
    <div className="flex items-center justify-center gap-4 py-6">
      {steps.map((step, index) => (
        <div key={step.path} className="flex items-center gap-2">
          <div className="flex flex-col items-center text-center">
            <div
              className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                index < currentStep
                  ? "bg-black text-white"
                  : index === currentStep
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {index + 1}
            </div>
            <span className="text-sm font-medium mt-1">{step.label}</span>
            <span className="text-xs text-muted-foreground">{step.desc}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={clsx("w-10 h-px", index < currentStep ? "bg-black" : "bg-gray-300")} />
          )}
        </div>
      ))}
    </div>
  );
}
