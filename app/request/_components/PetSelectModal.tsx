"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2Icon, XIcon } from "lucide-react";
import clsx from "clsx";

type Props = {
  species: string;
  ownedPets: any[];
  maxCount: number;
  selectedIds: string[];
  onSave: (species: string, selectedIds: string[]) => void;
  onClose: () => void;
};

export default function PetSelectModal({
  species,
  ownedPets,
  maxCount,
  selectedIds,
  onSave,
  onClose,
}: Props) {
  const [selected, setSelected] = useState<string[]>(selectedIds);

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected((prev) => prev.filter((i) => i !== id));
    } else {
      if (selected.length < maxCount) {
        setSelected((prev) => [...prev, id]);
      }
    }
  };

  const handleConfirm = () => {
    onSave(species, selected);
  };

  useEffect(() => {
    if (selected.length > maxCount) {
      setSelected((prev) => prev.slice(0, maxCount));
    }
  }, [maxCount]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>
            {species} için {maxCount} pet seçin
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-2">
          <div className="grid grid-cols-2 gap-3 mt-4">
            {ownedPets.map((pet) => {
              const isSelected = selected.includes(pet.id);
              return (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => toggleSelect(pet.id)}
                  className={clsx(
                    "relative flex flex-col items-center border rounded-xl p-3 text-sm transition hover:shadow-md",
                    isSelected
                      ? "border-primary ring-2 ring-primary/50"
                      : "bg-white"
                  )}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-2 relative">
                    <Image
                      src={pet.image || "/placeholder.jpg"}
                      alt={pet.name || "Pet"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-center font-medium">{pet.name}</div>
                  {isSelected && (
                    <CheckCircle2Icon className="absolute top-2 right-2 text-primary w-5 h-5" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-between mt-4">
          <Button variant="ghost" onClick={onClose}>
            <XIcon className="w-4 h-4 mr-1" />
            Vazgeç
          </Button>
          <Button
            disabled={selected.length !== maxCount}
            onClick={handleConfirm}
          >
            Seçimi Onayla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
