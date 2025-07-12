"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Stepper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultValue?: number
  }
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("flex", className)} {...props} />
})
Stepper.displayName = "Stepper"

const StepperItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { step: number }
>(({ className, step, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-step={step}
      className={cn("flex items-center", className)}
      {...props}
    />
  )
})
StepperItem.displayName = "StepperItem"

const StepperTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-full bg-white p-2 px-4 shadow-sm border text-sm font-medium",
        className
      )}
      {...props}
    />
  )
})
StepperTrigger.displayName = "StepperTrigger"

const StepperIndicator = () => (
  <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium">
    <Check className="h-3 w-3" />
  </span>
)
StepperIndicator.displayName = "StepperIndicator"

const StepperTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm font-semibold">{children}</div>
)

const StepperDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs text-muted-foreground">{children}</div>
)

const StepperSeparator = ({ className }: { className?: string }) => (
  <div className={cn("h-px bg-border w-8", className)} />
)

export {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
}
