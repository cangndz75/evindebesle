"use client";

import clsx from "clsx";

type StepperProps = {
  activeStep: number;
};

export default function Stepper({ activeStep }: StepperProps) {
  return (
    <div className="w-full px-4 py-6 flex justify-center">
      <div className="bg-white shadow-sm rounded-xl px-6 py-6 w-full max-w-md flex flex-col items-center gap-6">
        {/* Üst: 1 ve 2 */}
        <div className="flex items-center justify-center gap-10">
          {[0, 1].map((index) => (
            <div key={index} className="flex items-center gap-2">
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
                  "text-sm font-medium",
                  activeStep === index + 1
                    ? "text-black"
                    : "text-muted-foreground"
                )}
              >
                {index === 0 ? "Hizmet Seçimi" : "Tarih Seçimi"}
              </span>
            </div>
          ))}
        </div>

        {/* Alt: 3 */}
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              activeStep === 3
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-500"
            )}
          >
            3
          </div>
          <span
            className={clsx(
              "text-sm font-medium",
              activeStep === 3 ? "text-black" : "text-muted-foreground"
            )}
          >
            Ödeme Planı
          </span>
        </div>
      </div>
    </div>
  );
}
