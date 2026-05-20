"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PrivacyDocumentContent,
  TermsDocumentContent,
} from "@/components/legal/legal-document-content";

export type LegalDocumentType = "terms" | "privacy";

const TITLES: Record<LegalDocumentType, string> = {
  terms: "Kullanım Koşulları",
  privacy: "Gizlilik Politikası",
};

type LegalDocumentModalProps = {
  type: LegalDocumentType | null;
  onClose: () => void;
};

export default function LegalDocumentModal({
  type,
  onClose,
}: LegalDocumentModalProps) {
  return (
    <Dialog open={type !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="z-10060"
        className="z-10060 flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {type ? TITLES[type] : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-6 py-5">
          {type === "terms" && <TermsDocumentContent />}
          {type === "privacy" && <PrivacyDocumentContent />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Metin içinde tıklanabilir yasal link */
export function LegalTextLink({
  type,
  children,
  onOpen,
}: {
  type: LegalDocumentType;
  children: ReactNode;
  onOpen: (type: LegalDocumentType) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen(type);
      }}
      className="font-semibold text-[#111] underline decoration-gray-300 underline-offset-2 transition-colors hover:decoration-[#111]"
    >
      {children}
    </button>
  );
}
