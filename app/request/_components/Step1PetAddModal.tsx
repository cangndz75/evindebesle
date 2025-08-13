"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PetAddForm from "@/app/(account)/profile/PetAddForm";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  species?: string;
};

export default function Step1PetAddModal({ open, onClose, onAdded, species }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[90vw] h-[90vh] mt-10 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-bold">Evcil Hayvan Ekle</DialogTitle>
        </DialogHeader>
        <div className="w-full px-6 pb-6">
          <PetAddForm species={species} onSaved={onAdded} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
