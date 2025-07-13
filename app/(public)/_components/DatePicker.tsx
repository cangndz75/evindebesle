"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  selected: Date[];
  onSelect: (dates: Date[]) => void;
}

function areDatesSequential(dates: Date[]) {
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays !== 1) return false;
  }
  return true;
}

export default function DatePicker({ selected, onSelect }: DatePickerProps) {
  const handleSelect = (dates?: Date[]) => {
    if (!dates || dates.length === 0) return;
    if (dates.length === 1) return onSelect(dates);

    if (areDatesSequential(dates)) {
      onSelect(dates);
    } else {
      onSelect([dates[dates.length - 1]]);
    }
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
