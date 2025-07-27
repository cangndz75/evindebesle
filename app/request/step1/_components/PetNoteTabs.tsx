"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  petId: string;
  speciesName: string;
  count: number;
  details: {
    allergy?: string;
    sensitivity?: string;
    specialNote?: string;
  }[];
  onUpdate: (
    index: number,
    field: "allergy" | "sensitivity" | "specialNote",
    value: string
  ) => void;
}

export default function PetNoteTabs({
  petId,
  speciesName,
  count,
  details,
  onUpdate,
}: Props) {
  return (
    <div className="mt-6 bg-white p-4 rounded-xl border shadow">
      <h3 className="font-semibold text-lg mb-2">
        {speciesName} için Bilgiler
      </h3>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <TabsTrigger key={i} value={(i + 1).toString()}>
              {i + 1}. {speciesName}
            </TabsTrigger>
          ))}
        </TabsList>

        {Array.from({ length: count }).map((_, i) => (
          <TabsContent key={i} value={(i + 1).toString()}>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Alerji Bilgisi</Label>
                <Textarea
                  value={details?.[i]?.allergy || ""}
                  onChange={(e) => onUpdate(i, "allergy", e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  Hassasiyet Bilgisi
                </Label>
                <Textarea
                  value={details?.[i]?.sensitivity || ""}
                  onChange={(e) => onUpdate(i, "sensitivity", e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Özel Not</Label>
                <Textarea
                  value={details?.[i]?.specialNote || ""}
                  onChange={(e) => onUpdate(i, "specialNote", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
