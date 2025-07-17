"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreateCouponForm } from "./CreateCouponForm"
import { Coupon } from "../page"

type Props = {
  open: boolean
  onOpenChange: (val: boolean) => void
  coupon: Coupon | null
  onUpdated: () => void
}

export function EditCouponModal({ open, onOpenChange, coupon, onUpdated }: Props) {
  if (!coupon) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kuponu Düzenle</DialogTitle>
        </DialogHeader>

        <CreateCouponForm
          defaultValues={coupon}
          editMode
          onSaved={() => {
            onOpenChange(false)
            onUpdated()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
