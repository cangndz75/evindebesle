"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

export type DateRangeValue = "today" | "7d" | "30d" | "90d" | "custom";

interface DateRangeSelectorProps {
    value: DateRangeValue;
    onChange: (value: DateRangeValue) => void;
    onCustomRange?: (startDate: Date, endDate: Date) => void;
}

export default function DateRangeSelector({
    value,
    onChange,
    onCustomRange,
}: DateRangeSelectorProps) {
    const [showCustom, setShowCustom] = useState(false);

    const handleValueChange = (newValue: DateRangeValue) => {
        onChange(newValue);
        if (newValue === "custom") {
            setShowCustom(true);
        } else {
            setShowCustom(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select value={value} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">BugÃ¼n</SelectItem>
                    <SelectItem value="7d">Son 7 GÃ¼n</SelectItem>
                    <SelectItem value="30d">Son 30 GÃ¼n</SelectItem>
                    <SelectItem value="90d">Son 90 GÃ¼n</SelectItem>
                    <SelectItem value="custom">Ã–zel Tarih AralÄ±ÄŸÄ±</SelectItem>
                </SelectContent>
            </Select>

            {showCustom && (
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        className="px-3 py-2 border rounded-md text-sm"
                        onChange={(e) => {
                            if (onCustomRange && e.target.value) {
                            }
                        }}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="date"
                        className="px-3 py-2 border rounded-md text-sm"
                        onChange={(e) => {
                            if (onCustomRange && e.target.value) {
                                const endDate = new Date(e.target.value);
                                const startDate = new Date(endDate);
                                startDate.setDate(startDate.getDate() - 30);
                                onCustomRange(startDate, endDate);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export function getDateRange(value: DateRangeValue): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date();
    let startDate = new Date();

    switch (value) {
        case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case "7d":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "30d":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case "90d":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
}
