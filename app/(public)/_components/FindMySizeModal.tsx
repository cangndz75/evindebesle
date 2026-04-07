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
  productName?: string;
  availableSizes?: string[];
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

function toSizeKey(label: string): string {
  return normalize(label).replace(/\s+/g, "").toUpperCase();
}

const ALPHA_ORDER = [
  "XXXXS",
  "XXXS",
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "XXXXL",
  "XXXXXL",
];

function normalizeAlphaSize(value: string): string | null {
  const compact = toSizeKey(value).replace(/[^A-Z0-9]/g, "");
  const xlMatch = compact.match(/^(\d)XL$/);
  if (xlMatch) {
    const xCount = Number(xlMatch[1]);
    if (xCount >= 1 && xCount <= 6) {
      return `${"X".repeat(xCount)}L`;
    }
  }
  if (ALPHA_ORDER.includes(compact)) {
    return compact;
  }
  return null;
}

function parseBraSize(value: string): { band: number; cup: string } | null {
  const compact = toSizeKey(value).replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^(\d{2,3})([A-Z]{1,3})$/);
  if (!match) return null;
  return {
    band: Number(match[1]),
    cup: match[2],
  };
}

function parseNumericSize(value: string): number | null {
  const compact = toSizeKey(value).replace(/[^0-9.]/g, "");
  if (!compact) return null;
  const parsed = Number(compact);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function cupToScore(cup: string): number {
  const normalizedCup = cup.toUpperCase();
  const cupScale = ["AA", "A", "B", "C", "D", "DD", "E", "F", "G", "H"];
  const exact = cupScale.indexOf(normalizedCup);
  if (exact >= 0) return exact;
  return normalizedCup.charCodeAt(0) - 64;
}

type SizeCandidate = {
  raw: string;
  key: string;
  type: "bra" | "alpha" | "numeric" | "other";
  alpha?: string;
  alphaRank?: number;
  band?: number;
  cup?: string;
  cupScore?: number;
  numeric?: number;
};

function buildSizeCandidates(availableSizes: string[]): SizeCandidate[] {
  const unique = Array.from(
    new Map(
      availableSizes
        .map((size) => String(size || "").trim())
        .filter(Boolean)
        .map((size) => [toSizeKey(size), size])
    ).values()
  );

  return unique.map((raw) => {
    const key = toSizeKey(raw);
    const bra = parseBraSize(raw);
    if (bra) {
      return {
        raw,
        key,
        type: "bra",
        band: bra.band,
        cup: bra.cup,
        cupScore: cupToScore(bra.cup),
      };
    }

    const alpha = normalizeAlphaSize(raw);
    if (alpha) {
      return {
        raw,
        key,
        type: "alpha",
        alpha,
        alphaRank: ALPHA_ORDER.indexOf(alpha),
      };
    }

    const numeric = parseNumericSize(raw);
    if (numeric !== null) {
      return {
        raw,
        key,
        type: "numeric",
        numeric,
      };
    }

    return {
      raw,
      key,
      type: "other",
    };
  });
}

function detectProfile(
  categorySlug?: string,
  categoryName?: string,
  productName?: string,
  candidates: SizeCandidate[] = []
): ProfileConfig {
  const text = normalize(`${categorySlug || ""} ${categoryName || ""} ${productName || ""}`);

  const braCount = candidates.filter((candidate) => candidate.type === "bra").length;
  if (braCount > 0) return profiles[0];

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

function normalizeBraPrediction(predicted: string): { band: number; cup: string; cupScore: number } | null {
  const parsed = parseBraSize(predicted);
  if (!parsed) return null;
  return {
    band: parsed.band,
    cup: parsed.cup,
    cupScore: cupToScore(parsed.cup),
  };
}

function rankBraCandidates(
  candidates: SizeCandidate[],
  underbust: number,
  predicted?: string
): SizeCandidate[] {
  const braPredicted = predicted ? normalizeBraPrediction(predicted) : null;

  return candidates
    .filter((candidate) => candidate.type === "bra")
    .sort((left, right) => {
      const leftBand = left.band || 0;
      const rightBand = right.band || 0;
      const leftCupScore = left.cupScore || 0;
      const rightCupScore = right.cupScore || 0;

      const leftBandDistance = Math.abs(leftBand - underbust);
      const rightBandDistance = Math.abs(rightBand - underbust);

      const leftCupDistance = braPredicted ? Math.abs(leftCupScore - braPredicted.cupScore) : 0;
      const rightCupDistance = braPredicted ? Math.abs(rightCupScore - braPredicted.cupScore) : 0;

      const leftScore = leftBandDistance + leftCupDistance * 2;
      const rightScore = rightBandDistance + rightCupDistance * 2;

      return leftScore - rightScore;
    });
}

function rankAlphaCandidates(candidates: SizeCandidate[], predicted: string): SizeCandidate[] {
  const normalizedPredicted = normalizeAlphaSize(predicted) || "M";
  const predictedRank = ALPHA_ORDER.indexOf(normalizedPredicted);

  return candidates
    .filter((candidate) => candidate.type === "alpha")
    .sort((left, right) => {
      const leftRank = left.alphaRank ?? 0;
      const rightRank = right.alphaRank ?? 0;
      return Math.abs(leftRank - predictedRank) - Math.abs(rightRank - predictedRank);
    });
}

function estimateNumericTarget(profile: ProfileConfig, inputs: Record<string, number>): number {
  if (profile.id === "bottom") {
    if (inputs.waist) return inputs.waist / 2;
    if (inputs.hip) return inputs.hip / 2;
  }

  if (profile.id === "bra") {
    if (inputs.underbust) return inputs.underbust;
  }

  if (inputs.chest) return inputs.chest / 2;
  if (inputs.waist) return inputs.waist / 2;
  return 0;
}

function rankNumericCandidates(candidates: SizeCandidate[], target: number): SizeCandidate[] {
  return candidates
    .filter((candidate) => candidate.type === "numeric")
    .sort((left, right) => {
      const leftDistance = Math.abs((left.numeric || 0) - target);
      const rightDistance = Math.abs((right.numeric || 0) - target);
      return leftDistance - rightDistance;
    });
}

function constrainResultToAvailableSizes(
  predicted: string,
  profile: ProfileConfig,
  inputs: Record<string, number>,
  candidates: SizeCandidate[]
): { recommended: string; alternatives: string[]; confidence: "Yuksek" | "Orta" | "Dusuk" } {
  if (candidates.length === 0) {
    return {
      recommended: predicted,
      alternatives: [],
      confidence: "Dusuk",
    };
  }

  const predictedKey = toSizeKey(predicted);
  const exact = candidates.find((candidate) => candidate.key === predictedKey);
  if (exact) {
    const alternatives = candidates
      .filter((candidate) => candidate.key !== exact.key)
      .slice(0, 2)
      .map((candidate) => candidate.raw);

    return {
      recommended: exact.raw,
      alternatives,
      confidence: "Orta",
    };
  }

  const braCandidates = candidates.filter((candidate) => candidate.type === "bra");
  if (braCandidates.length > 0) {
    const ranked = rankBraCandidates(candidates, inputs.underbust || 75, predicted);
    return {
      recommended: ranked[0]?.raw || candidates[0].raw,
      alternatives: ranked.slice(1, 3).map((candidate) => candidate.raw),
      confidence: "Orta",
    };
  }

  const alphaCandidates = candidates.filter((candidate) => candidate.type === "alpha");
  if (alphaCandidates.length > 0) {
    const ranked = rankAlphaCandidates(candidates, predicted);
    return {
      recommended: ranked[0]?.raw || candidates[0].raw,
      alternatives: ranked.slice(1, 3).map((candidate) => candidate.raw),
      confidence: "Orta",
    };
  }

  const numericCandidates = candidates.filter((candidate) => candidate.type === "numeric");
  if (numericCandidates.length > 0) {
    const target = estimateNumericTarget(profile, inputs);
    const ranked = rankNumericCandidates(candidates, target);
    return {
      recommended: ranked[0]?.raw || candidates[0].raw,
      alternatives: ranked.slice(1, 3).map((candidate) => candidate.raw),
      confidence: "Dusuk",
    };
  }

  return {
    recommended: candidates[0].raw,
    alternatives: candidates.slice(1, 3).map((candidate) => candidate.raw),
    confidence: "Dusuk",
  };
}

function calculateFromTable(
  headers: string[],
  rows: string[][],
  profile: ProfileConfig,
  inputs: Record<string, number>,
  candidates: SizeCandidate[]
): ResultData | null {
  if (!headers.length || !rows.length) return null;

  const indexes: Record<string, number> = {};
  for (const field of profile.fields) {
    const aliases = profile.aliases[field.key] || [];
    indexes[field.key] = getHeaderIndex(headers, aliases);
  }

  const allowedKeys = new Set(candidates.map((candidate) => candidate.key));

  const scored = rows
    .map((row) => {
      const sizeLabel = row[0]?.trim();
      if (!sizeLabel) return null;
      const sizeKey = toSizeKey(sizeLabel);
      if (allowedKeys.size > 0 && !allowedKeys.has(sizeKey)) return null;

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

      return { sizeLabel, sizeKey, score, matchedFields };
    })
    .filter((item): item is { sizeLabel: string; sizeKey: string; score: number; matchedFields: number } => Boolean(item))
    .sort((a, b) => a.score - b.score);

  if (scored.length === 0) return null;

  const recommendedCandidate = candidates.find((candidate) => candidate.key === scored[0].sizeKey);
  const recommended = recommendedCandidate?.raw || scored[0].sizeLabel;
  const alternatives = scored
    .slice(1, 3)
    .map((item) => candidates.find((candidate) => candidate.key === item.sizeKey)?.raw || item.sizeLabel);
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
  productName,
  availableSizes = [],
  sizeGuide,
}: FindMySizeModalProps) {
  const sizeCandidates = useMemo(() => buildSizeCandidates(availableSizes), [availableSizes]);
  const profile = useMemo(
    () => detectProfile(categorySlug, categoryName, productName, sizeCandidates),
    [categorySlug, categoryName, productName, sizeCandidates]
  );
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

    const tableResult = calculateFromTable(headers, rows, profile, numericInputs, sizeCandidates);
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
      const fallback = fallbackBra(underbust, bust);
      const constrained = constrainResultToAvailableSizes(fallback, profile, numericInputs, sizeCandidates);
      setResult({
        recommended: constrained.recommended,
        alternatives: constrained.alternatives,
        confidence: constrained.confidence,
        reason: sizeCandidates.length > 0
          ? "Urunun mevcut sutyen bedenlerine gore en yakin sonuc secildi."
          : "Kategoride tablo bulunmadigi icin genel sutyen kurali kullanildi.",
      });
      return;
    }

    if (profile.id === "bottom") {
      const waist = numericInputs.waist;
      if (!waist) {
        setError("Bel cevresi gerekli.");
        return;
      }
      const fallback = fallbackBottom(waist);
      const constrained = constrainResultToAvailableSizes(fallback, profile, numericInputs, sizeCandidates);
      setResult({
        recommended: constrained.recommended,
        alternatives: constrained.alternatives,
        confidence: constrained.confidence,
        reason: sizeCandidates.length > 0
          ? "Urunun mevcut alt giyim bedenlerine gore en yakin sonuc secildi."
          : "Kategoride tablo bulunmadigi icin genel alt giyim kurali kullanildi.",
      });
      return;
    }

    const chest = numericInputs.chest;
    if (!chest) {
      setError("Gogus cevresi gerekli.");
      return;
    }

    const fallback = fallbackTop(chest);
    const constrained = constrainResultToAvailableSizes(fallback, profile, numericInputs, sizeCandidates);
    setResult({
      recommended: constrained.recommended,
      alternatives: constrained.alternatives,
      confidence: constrained.confidence,
      reason: sizeCandidates.length > 0
        ? "Ürünün mevcut üst giyim bedenlerine göre en yakın sonuç seçildi."
        : "Kategoride tablo bulunmadığı için genel üst giyim kuralı kullanıldı.",
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
          {sizeCandidates.length > 0 && (
            <p className="text-xs text-gray-600">
              Bu urun icin mevcut bedenler: {sizeCandidates.map((candidate) => candidate.raw).join(", ")}
            </p>
          )}

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
