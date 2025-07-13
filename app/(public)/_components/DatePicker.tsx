"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  selected: Date[];
  onSelect: (dates: Date[]) => void;
}

export default function DatePicker({ selected, onSelect }: DatePickerProps) {
  const handleSelect = (dates?: Date[]) => {
    if (!dates) return;
    onSelect(dates);
  };

  return (
    <DayPicker
      mode="multiple"
      selected={selected}
      onSelect={handleSelect}
      className="rounded-md border shadow bg-white p-4"
    />
  );
}
