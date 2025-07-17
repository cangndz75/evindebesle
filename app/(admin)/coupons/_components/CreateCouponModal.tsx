"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreateCouponForm } from "./CreateCouponForm"

type Props = {
  open: boolean
  onOpenChange: (val: boolean) => void
  onCreated?: () => void;
}

export function CreateCouponModal({ open, onOpenChange, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>🎫 Yeni Kupon Oluştur</DialogTitle>
        </DialogHeader>

        <CreateCouponForm onSaved={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
