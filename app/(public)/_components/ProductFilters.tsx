"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";

type FilterState = {
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  fabricTypes: string[];
};

type ActiveFilter = {
  type: "price" | "size" | "color" | "fabric";
  label: string;
  value: string;
};

type ProductFiltersProps = {
  availableSizes: string[];
  availableColors: string[];
  availableFabricTypes: string[];
  priceRange: { min: number; max: number };
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filter: ActiveFilter) => void;
  onClearFilters: () => void;
};

export default function ProductFilters({
  availableSizes,
  availableColors,
  availableFabricTypes,
  priceRange,
  filters,
  onFiltersChange,
  activeFilters,
  onRemoveFilter,
  onClearFilters,
}: ProductFiltersProps) {
  const [open, setOpen] = useState(false); // Butona tıklayınca açılsın
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // filters prop'u değiştiğinde localFilters'ı güncelle
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const toggleArrayFilter = (key: "sizes" | "colors" | "fabricTypes", value: string) => {
    const current = localFilters[key] || [];
    const newArray = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, newArray);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const emptyFilters: FilterState = {
      sizes: [],
      colors: [],
      fabricTypes: [],
    };
    setLocalFilters(emptyFilters);
    onClearFilters();
  };

  return (
    <div className="space-y-4">
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span>{filter.label}</span>
              <button
                onClick={() => onRemoveFilter(filter)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs"
          >
            Temizle
          </Button>
        </div>
      )}

      {/* Filter Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-light text-[#111] border border-[#111] bg-white hover:bg-[#111] hover:text-white transition-colors">
            {/* Filter Icon - 3 lines with arrows on middle line */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Top line (long) */}
              <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Middle line (shorter with arrows) */}
              <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Left arrow */}
              <path d="M3 7L4 8L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* Right arrow */}
              <path d="M13 7L12 8L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* Bottom line (long) */}
              <path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Filtrele</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[400px] overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b flex flex-row items-center justify-between">
            <SheetTitle className="text-left font-bold text-[#111]">Filtreler</SheetTitle>
            <button
              onClick={() => setOpen(false)}
              className="text-[#111] hover:opacity-70 transition-opacity"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>

          <div className="px-6 py-4">
            <Accordion type="multiple" className="w-full space-y-0">
              {/* Price Filter */}
              <AccordionItem value="price" className="border-b border-gray-200">
                <AccordionTrigger className="py-4 hover:no-underline px-0">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="text-sm font-semibold uppercase text-[#111]">FİYAT</span>
                    <ChevronDown className="w-4 h-4 text-[#111] transition-transform duration-200" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 px-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Min (₺)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={localFilters.minPrice || ""}
                          onChange={(e) =>
                            updateFilter("minPrice", e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                          className="w-full border-gray-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Max (₺)</Label>
                        <Input
                          type="number"
                          placeholder="2000"
                          value={localFilters.maxPrice || ""}
                          onChange={(e) =>
                            updateFilter("maxPrice", e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                          className="w-full border-gray-300"
                        />
                      </div>
                    </div>
                    <div className="px-2 pt-2">
                      <Slider
                        value={[
                          localFilters.minPrice || priceRange.min,
                          localFilters.maxPrice || priceRange.max,
                        ]}
                        min={priceRange.min}
                        max={priceRange.max}
                        step={10}
                        onValueChange={(values) => {
                          const [min, max] = values;
                          updateFilter("minPrice", min);
                          updateFilter("maxPrice", max);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <AccordionItem value="size" className="border-b border-gray-200">
                  <AccordionTrigger className="py-4 hover:no-underline px-0">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="text-sm font-semibold uppercase text-[#111]">BEDEN</span>
                      <ChevronDown className="w-4 h-4 text-[#111] transition-transform duration-200" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 px-0">
                    <div className="grid grid-cols-3 gap-3">
                      {availableSizes.map((size) => (
                        <div key={size} className="flex items-center space-x-2">
                          <Checkbox
                            id={`size-${size}`}
                            checked={localFilters.sizes?.includes(size) || false}
                            onCheckedChange={() => toggleArrayFilter("sizes", size)}
                          />
                          <Label
                            htmlFor={`size-${size}`}
                            className="text-sm cursor-pointer font-normal"
                          >
                            {size}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Color Filter */}
              {availableColors.length > 0 && (
                <AccordionItem value="color" className="border-b border-gray-200">
                  <AccordionTrigger className="py-4 hover:no-underline px-0">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="text-sm font-semibold uppercase text-[#111]">RENK</span>
                      <ChevronDown className="w-4 h-4 text-[#111] transition-transform duration-200" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 px-0">
                    <div className="space-y-2">
                      {availableColors.map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${color}`}
                            checked={localFilters.colors?.includes(color) || false}
                            onCheckedChange={() => toggleArrayFilter("colors", color)}
                          />
                          <Label
                            htmlFor={`color-${color}`}
                            className="text-sm cursor-pointer font-normal capitalize"
                          >
                            {color}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Fabric Type Filter */}
              {availableFabricTypes.length > 0 && (
                <AccordionItem value="fabric" className="border-b border-gray-200">
                  <AccordionTrigger className="py-4 hover:no-underline px-0">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="text-sm font-semibold uppercase text-[#111]">KUMAŞ TİPİ</span>
                      <ChevronDown className="w-4 h-4 text-[#111] transition-transform duration-200" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 px-0">
                    <div className="space-y-2">
                      {availableFabricTypes.map((fabric) => (
                        <div key={fabric} className="flex items-center space-x-2">
                          <Checkbox
                            id={`fabric-${fabric}`}
                            checked={localFilters.fabricTypes?.includes(fabric) || false}
                            onCheckedChange={() => toggleArrayFilter("fabricTypes", fabric)}
                          />
                          <Label
                            htmlFor={`fabric-${fabric}`}
                            className="text-sm cursor-pointer font-normal"
                          >
                            {fabric}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Apply Button */}
            <div className="pt-6 mt-4 border-t">
              <Button 
                onClick={applyFilters} 
                className="w-full bg-[#111] text-white hover:bg-[#333] h-12 text-sm font-semibold uppercase tracking-wide"
              >
                Filtrele
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
