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
import { Filter, X } from "lucide-react";

export interface AnalyticsFilter {
    eventType?: string;
    device?: string;
    page?: string;
}

interface AnalyticsFiltersProps {
    filters: AnalyticsFilter;
    onChange: (filters: AnalyticsFilter) => void;
}

const EVENT_TYPES = [
    { value: "PAGE_VIEW", label: "Page View" },
    { value: "VIEW_PRODUCT", label: "View Product" },
    { value: "ADD_TO_CART", label: "Add to Cart" },
    { value: "REMOVE_FROM_CART", label: "Remove from Cart" },
    { value: "BEGIN_CHECKOUT", label: "Begin Checkout" },
    { value: "PURCHASE", label: "Purchase" },
    { value: "SEARCH", label: "Search" },
    { value: "SIGNUP", label: "Signup" },
    { value: "LOGIN", label: "Login" },
];

const DEVICE_TYPES = [
    { value: "mobile", label: "Mobile" },
    { value: "tablet", label: "Tablet" },
    { value: "desktop", label: "Desktop" },
];

export default function AnalyticsFilters({
    filters,
    onChange,
}: AnalyticsFiltersProps) {
    const hasActiveFilters =
        filters.eventType || filters.device || filters.page;

    const clearFilters = () => {
        onChange({});
    };

    const updateFilter = (key: keyof AnalyticsFilter, value: string | undefined) => {
        onChange({
            ...filters,
            [key]: value,
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtreler:</span>
            </div>

            
            <Select
                value={filters.eventType || "all"}
                onValueChange={(value) =>
                    updateFilter("eventType", value === "all" ? undefined : value)
                }
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Event'ler</SelectItem>
                    {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                            {type.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            
            <Select
                value={filters.device || "all"}
                onValueChange={(value) =>
                    updateFilter("device", value === "all" ? undefined : value)
                }
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Device" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Cihazlar</SelectItem>
                    {DEVICE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                            {type.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            
            <input
                type="text"
                placeholder="Sayfa filtrele..."
                value={filters.page || ""}
                onChange={(e) =>
                    updateFilter("page", e.target.value || undefined)
                }
                className="px-3 py-2 border rounded-md text-sm w-[200px]"
            />

            
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <X className="h-4 w-4 mr-1" />
                    Temizle
                </Button>
            )}
        </div>
    );
}
