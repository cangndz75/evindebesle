"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const timeOptions = ["08:00 - 12:00", "12:00 - 16:00", "16:00 - 20:00"];

export default function ServiceModal({
  selectedTime,
  setSelectedTime,
}: {
  selectedTime: string;
  setSelectedTime: (val: string) => void;
}) {
  const [tempTime, setTempTime] = useState(selectedTime);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Saat Aralığını Seç</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Hizmet Saat Aralığı
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {timeOptions.map((time) => (
            <button
              key={time}
              onClick={() => setTempTime(time)}
              className={cn(
                "border rounded-xl px-4 py-3 text-center font-medium transition-all",
                tempTime === time
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-800 hover:border-black"
              )}
            >
              {time}
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <DialogClose asChild>
            <Button
              onClick={() => setSelectedTime(tempTime)}
              disabled={!tempTime}
            >
              Seç
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
