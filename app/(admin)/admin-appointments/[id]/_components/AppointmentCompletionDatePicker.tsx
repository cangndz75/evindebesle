"use client";

import { useState } from "react";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

type Props = {
  value: Date | null;
  onChange: (date: Date) => void;
};

export default function AppointmentCompletionDatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const handleNowClick = () => {
    onChange(new Date());
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Gerçekleşme Tarihi / Saat</label>

      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "dd MMMM yyyy HH:mm:ss", { locale: tr }) : "Tarih seçin"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value || new Date()}
              onSelect={(date) => {
                if (date) {
                  const now = new Date();
                  const combined = new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds()
                  );
                  onChange(combined);
                  setOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" type="button" onClick={handleNowClick}>
          <ClockIcon className="mr-2 h-4 w-4" />
          Şu An
        </Button>
      </div>
    </div>
  );
}
