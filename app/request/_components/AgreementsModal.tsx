"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab: "preinfo" | "distance";
  preInfoHTML: string;
  distanceSalesHTML: string;
  onAcceptPreInfo?: () => void;
  onAcceptDistance?: () => void;
};

export default function AgreementsModal({
  open, onOpenChange, defaultTab,
  preInfoHTML, distanceSalesHTML,
  onAcceptPreInfo, onAcceptDistance,
}: Props) {
  const [tab, setTab] = useState<"preinfo" | "distance">(defaultTab);
  useEffect(() => setTab(defaultTab), [defaultTab]);

  const accept = () => {
    if (tab === "preinfo") onAcceptPreInfo?.();
    else onAcceptDistance?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[92vw] sm:w-[80vw] md:w-[720px] max-h-[80vh] p-0"
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Sözleşme ve Bilgilendirme</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <Tabs value={tab} onValueChange={(v)=>setTab(v as any)} className="mt-4">
            <TabsList className="mb-4">
              <TabsTrigger value="preinfo">Ön Bilgilendirme</TabsTrigger>
              <TabsTrigger value="distance">Mesafeli Satış</TabsTrigger>
            </TabsList>

            <TabsContent value="preinfo">
              <div
                className="prose prose-sm max-w-none bg-neutral-50 rounded-lg p-4 overflow-y-auto max-h-[52vh]"
                dangerouslySetInnerHTML={{ __html: preInfoHTML }}
              />
            </TabsContent>

            <TabsContent value="distance">
              <div
                className="prose prose-sm max-w-none bg-neutral-50 rounded-lg p-4 overflow-y-auto max-h-[52vh]"
                dangerouslySetInnerHTML={{ __html: distanceSalesHTML }}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex items-center justify-end">
            <Button onClick={accept}>Okudum, onaylıyorum</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
