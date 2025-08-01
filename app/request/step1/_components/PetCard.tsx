import { CheckIcon, User2Icon } from "lucide-react";
import clsx from "clsx";

type Props = {
  pet: {
    id: string;
    userPetName: string;
    petName: string;
  };
  selected: boolean;
  onSelect: () => void;
};

export default function PetCard({ pet, selected, onSelect }: Props) {
  return (
    <div
      onClick={onSelect}
      className={clsx(
        "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted transition",
        selected && "bg-orange-50 border-orange-500"
      )}
    >
      <div className="flex items-center gap-3">
        <User2Icon className="w-8 h-8 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="font-medium">{pet.userPetName}</span>
          <span className="text-sm text-muted-foreground">{pet.petName}</span>
        </div>
      </div>

      {selected ? (
        <div className="text-orange-600 font-semibold text-sm flex items-center gap-1">
          <span>Varsayılan</span>
          <CheckIcon className="w-5 h-5" />
        </div>
      ) : (
        <div className="w-5 h-5 border rounded-sm" />
      )}
    </div>
  );
}
