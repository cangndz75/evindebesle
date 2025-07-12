"use client"

import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper"

const steps = [
  { step: 1, title: "Evcil Hayvanlar", description: "Kaç tane bakılacak?" },
  { step: 2, title: "Hizmet Bilgisi", description: "Tarih, konum, hizmet" },
  { step: 3, title: "Ödeme", description: "Planını seç ve devam et" },
]

export default function StepperHeader() {
  return (
    <Stepper defaultValue={1}>
      {steps.map(({ step, title, description }) => (
        <StepperItem key={step} step={step} className="not-last:flex-1 max-md:items-start">
          <StepperTrigger className="rounded max-md:flex-col">
            <StepperIndicator />
            <div className="text-center md:text-left">
              <StepperTitle>{title}</StepperTitle>
              <StepperDescription>
                {description}
              </StepperDescription>
            </div>
          </StepperTrigger>
          {step < steps.length && (
            <StepperSeparator className="max-md:mt-3.5 md:mx-4" />
          )}
        </StepperItem>
      ))}
    </Stepper>
  )
}
