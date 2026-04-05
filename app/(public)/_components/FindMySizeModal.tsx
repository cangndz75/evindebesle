"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SizeGuideData = {
  id?: string;
  title?: string;
  imageUrl?: string | null;
  content?: {
    headers?: string[];
    rows?: string[][];
  } | null;
} | null;

type ResultData = {
  recommended: string;
  alternatives: string[];
  confidence: "Yuksek" | "Orta" | "Dusuk";
  reason: string;
};

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
};

type ProfileConfig = {
  id: "bra" | "top" | "bottom" | "generic";
  title: string;
  fields: FieldConfig[];
  aliases: Record<string, string[]>;
};

interface FindMySizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorySlug?: string;
  categoryName?: string;
  sizeGuide?: SizeGuideData;
}

const profiles: ProfileConfig[] = [
  {
    id: "bra",
    title: "Sutyen",
    fields: [
      { key: "underbust", label: "Alt Gogus Cevresi (cm)", placeholder: "Orn: 77", required: true },
      { key: "bust", label: "Gogus Cevresi (cm)", placeholder: "Orn: 90", required: true },
    ],
    aliases: {
      underbust: ["alt gogus", "underbust", "band", "gogus alti"],
      bust: ["gogus", "bust", "chest"],
    },
  },
  {
    id: "top",
    title: "Ust Giyim",
    fields: [
      { key: "chest", label: "Gogus Cevresi (cm)", placeholder: "Orn: 96", required: true },
      { key: "waist", label: "Bel Cevresi (cm)", placeholder: "Orn: 78" },
    ],
    aliases: {
      chest: ["gogus", "chest", "bust"],
      waist: ["bel", "waist"],
    },
  },
  {
    id: "bottom",
    title: "Alt Giyim",
    fields: [
      { key: "waist", label: "Bel Cevresi (cm)", placeholder: "Orn: 80", required: true },
      { key: "hip", label: "Kalca Cevresi (cm)", placeholder: "Orn: 102" },
    ],
    aliases: {
      waist: ["bel", "waist"],
      hip: ["kalca", "hip"],
    },
  },
  {
    id: "generic",
    title: "Genel",
    fields: [
      { key: "chest", label: "Gogus Cevresi (cm)", placeholder: "Orn: 96", required: true },
    ],
    aliases: {
      chest: ["gogus", "chest", "bust"],
    },
  },
];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function detectProfile(categorySlug?: string, categoryName?: string): ProfileConfig {
  const text = normalize(`${categorySlug || ""} ${categoryName || ""}`);

  if (/(sutyen|bra|bralet|bustiyer)/.test(text)) return profiles[0];
  if (/(pantolon|esofman|etek|sort|jean|tayt|alt)/.test(text)) return profiles[2];
  if (/(sweat|hoodie|gomlek|tisort|kazak|bluz|ceket|ust)/.test(text)) return profiles[1];
  return profiles[3];
}

function parseRange(raw: string): { min: number; max: number } | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, ".").replace(/cm/gi, "").trim();
  const values = cleaned.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];

  if (values.length === 0) return null;
  if (values.length === 1) return { min: values[0], max: values[0] };

  const first = values[0];
  const second = values[1];
  return {
    min: Math.min(first, second),
    max: Math.max(first, second),
  };
}

function getHeaderIndex(headers: string[], aliases: string[]) {
  const normalizedHeaders = headers.map((h) => normalize(h));
  for (let i = 0; i < normalizedHeaders.length; i++) {
    if (aliases.some((alias) => normalizedHeaders[i].includes(alias))) {
      return i;
    }
  }
  return -1;
}

function fallbackTop(chest: number): string {
  if (chest < 88) return "XS";
  if (chest < 96) return "S";
  if (chest < 104) return "M";
  if (chest < 112) return "L";
  if (chest < 120) return "XL";
  return "2XL";
}

function fallbackBottom(waist: number): string {
  if (waist < 70) return "XS";
  if (waist < 78) return "S";
  if (waist < 86) return "M";
  if (waist < 94) return "L";
  if (waist < 102) return "XL";
  return "2XL";
}

function fallbackBra(underbust: number, bust: number): string {
  const bands = [65, 70, 75, 80, 85, 90, 95];
  const nearestBand = bands.reduce((prev, curr) => {
    return Math.abs(curr - underbust) < Math.abs(prev - underbust) ? curr : prev;
  }, 75);

  const diff = bust - underbust;
  let cup = "A";
  if (diff >= 12 && diff < 14) cup = "A";
  else if (diff >= 14 && diff < 16) cup = "B";
  else if (diff >= 16 && diff < 18) cup = "C";
  else if (diff >= 18 && diff < 20) cup = "D";
  else if (diff >= 20) cup = "E";

  return `${nearestBand}${cup}`;
}

function calculateFromTable(
  headers: string[],
  rows: string[][],
  profile: ProfileConfig,
  inputs: Record<string, number>
): ResultData | null {
  if (!headers.length || !rows.length) return null;

  const indexes: Record<string, number> = {};
  for (const field of profile.fields) {
    const aliases = profile.aliases[field.key] || [];
    indexes[field.key] = getHeaderIndex(headers, aliases);
  }

  const scored = rows
    .map((row) => {
      const sizeLabel = row[0]?.trim();
      if (!sizeLabel) return null;

      let score = 0;
      let matchedFields = 0;

      for (const field of profile.fields) {
        const value = inputs[field.key];
        const index = indexes[field.key];
        if (!value || index < 0 || index >= row.length) continue;

        const range = parseRange(String(row[index]));
        if (!range) continue;

        matchedFields += 1;
        if (value >= range.min && value <= range.max) {
          const mid = (range.min + range.max) / 2;
          score += Math.abs(value - mid) / 10;
        } else if (value < range.min) {
          score += range.min - value + 10;
        } else {
          score += value - range.max + 10;
        }
      }

      if (matchedFields === 0) return null;
      score -= matchedFields * 2;

      return { sizeLabel, score, matchedFields };
    })
    .filter((item): item is { sizeLabel: string; score: number; matchedFields: number } => Boolean(item))
    .sort((a, b) => a.score - b.score);

  if (scored.length === 0) return null;

  const recommended = scored[0].sizeLabel;
  const alternatives = scored.slice(1, 3).map((item) => item.sizeLabel);
  const confidence = scored[0].matchedFields >= 2 ? "Yuksek" : "Orta";

  return {
    recommended,
    alternatives,
    confidence,
    reason: "Kategori olcu tablosuna gore hesaplandi.",
  };
}

export default function FindMySizeModal({
  open,
  onOpenChange,
  categorySlug,
  categoryName,
  sizeGuide,
}: FindMySizeModalProps) {
  const profile = useMemo(() => detectProfile(categorySlug, categoryName), [categorySlug, categoryName]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headers = Array.isArray(sizeGuide?.content?.headers) ? sizeGuide?.content?.headers || [] : [];
  const rows = Array.isArray(sizeGuide?.content?.rows) ? sizeGuide?.content?.rows || [] : [];

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    setError(null);

    const numericInputs: Record<string, number> = {};
    for (const field of profile.fields) {
      const raw = values[field.key]?.trim() || "";
      if (!raw && field.required) {
        setError(`${field.label} gerekli.`);
        return;
      }
      if (raw) {
        const parsed = Number(raw.replace(",", "."));
        if (Number.isNaN(parsed) || parsed <= 0) {
          setError(`${field.label} gecerli bir sayi olmali.`);
          return;
        }
        numericInputs[field.key] = parsed;
      }
    }

    const tableResult = calculateFromTable(headers, rows, profile, numericInputs);
    if (tableResult) {
      setResult(tableResult);
      return;
    }

    if (profile.id === "bra") {
      const underbust = numericInputs.underbust;
      const bust = numericInputs.bust;
      if (!underbust || !bust) {
        setError("Alt gogus ve gogus cevresi gerekli.");
        return;
      }
      const recommended = fallbackBra(underbust, bust);
      setResult({
        recommended,
        alternatives: [],
        confidence: "Dusuk",
        reason: "Kategoride tablo bulunmadigi icin genel sutyen kurali kullanildi.",
      });
      return;
    }

    if (profile.id === "bottom") {
      const waist = numericInputs.waist;
      if (!waist) {
        setError("Bel cevresi gerekli.");
        return;
      }
      const recommended = fallbackBottom(waist);
      setResult({
        recommended,
        alternatives: [],
        confidence: "Dusuk",
        reason: "Kategoride tablo bulunmadigi icin genel alt giyim kurali kullanildi.",
      });
      return;
    }

    const chest = numericInputs.chest;
    if (!chest) {
      setError("Gogus cevresi gerekli.");
      return;
    }

    const recommended = fallbackTop(chest);
    setResult({
      recommended,
      alternatives: [],
      confidence: "Dusuk",
      reason: "Kategoride tablo bulunmadigi icin genel ust giyim kurali kullanildi.",
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setResult(null);
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bedenimi Bul - {profile.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {profile.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`find-size-${field.key}`}>{field.label}</Label>
              <Input
                id={`find-size-${field.key}`}
                inputMode="decimal"
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={handleCalculate} className="w-full">
            Beden Oner
          </Button>

          {result && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-2 bg-gray-50">
              <p className="text-sm text-gray-700">Onerilen beden</p>
              <p className="text-2xl font-semibold text-black">{result.recommended}</p>
              <p className="text-xs text-gray-500">Guven: {result.confidence}</p>
              <p className="text-sm text-gray-700">{result.reason}</p>
              {result.alternatives.length > 0 && (
                <p className="text-sm text-gray-700">
                  Alternatifler: {result.alternatives.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
