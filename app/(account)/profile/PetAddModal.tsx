"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import PetAddForm from "./PetAddForm";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export default function PetAddModal({ open, onClose, onAdded }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[90vw] h-[90vh] mt-10 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-bold">
            Evcil Hayvan Ekle
          </DialogTitle>
          <DialogClose asChild>
          </DialogClose>
        </DialogHeader>
        <div className="w-full px-6 pb-6">
          <PetAddForm onSaved={onAdded} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
