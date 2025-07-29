"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AccessInfoForm from "./AccessInfoForm";

interface AccessInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  onSuccess?: () => void;
}

export function AccessInfoModal({
  open,
  onOpenChange,
  appointmentId,
}: AccessInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Erişim Bilgileri</DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          <AccessInfoForm
            appointmentId={appointmentId}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
