"use client";

import { useState, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  selected: Date[];
  onSelect: (dates: Date[]) => void;
}

export default function DatePicker({ selected, onSelect }: DatePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (selected.length >= 2) {
      return { from: selected[0], to: selected[selected.length - 1] };
    } else if (selected.length === 1) {
      return { from: selected[0], to: undefined };
    }
    return undefined;
  });

  useEffect(() => {
    if (!range?.from || !range.to) return;

    const days: Date[] = [];
    const current = new Date(range.from);

    while (current <= range.to) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    onSelect(days);
  }, [range]);

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={setRange}
      disabled={{ before: new Date() }}
      className="rounded-md border shadow bg-white p-4"
    />
  );
}
