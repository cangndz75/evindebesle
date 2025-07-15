import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ServiceCard({
  service,
  selected,
  toggle,
}: {
  service: {
    id: string;
    name: string;
    price: number;
    description?: string;
    petTags: string[];
  };
  selected: boolean;
  toggle: () => void;
}) {
  return (
    <button
      onClick={toggle}
      className={`flex items-center justify-between w-full border rounded-xl px-4 py-3 mb-2 transition-all
        ${selected ? "border-black bg-black text-white" : "border-gray-300 bg-white hover:border-black"}
      `}
    >
      <div className="flex flex-col text-left">
        <span className="font-medium text-base">{service.name}</span>
        <div className="flex gap-2 mt-1">
          {service.petTags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-700 uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`font-semibold text-sm px-3 py-1 rounded-lg
            ${selected ? "bg-white text-black" : "bg-black text-white"}
          `}
        >
          {service.price}₺
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                {service.description || "Açıklama bulunamadı."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </button>
  );
}
