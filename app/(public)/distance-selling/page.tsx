"use client";

import { FileText } from "lucide-react";
import DistanceSellingBody from "@/components/legal/DistanceSellingBody";

export default function DistanceSellingPage() {
  return (
    <div className="min-h-[60vh] bg-white py-10">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold">Mesafeli Satış Sözleşmesi</h1>
        </div>
        <DistanceSellingBody />
      </div>
    </div>
  );
}
