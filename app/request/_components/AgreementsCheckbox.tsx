"use client";

import * as React from "react";
import AgreementsModal from "./AgreementsModal";
import { useAgreementsDocs } from "@/hooks/useAgreementsDocs";

export type AgreementsState = {
  preInfoAccepted: boolean;
  distanceAccepted: boolean;
};

type LineItem = { description: string; quantity: number; unitPrice: number; subtotal?: number };
type Discount = { label: string; amount: number };

type AgreementsCheckboxProps = {
  value: AgreementsState;
  onChange: React.Dispatch<React.SetStateAction<AgreementsState>>;

  // dinamik içerik kaynağı – Summary’den doluyor
  items: LineItem[];
  shippingFee?: number;
  discounts?: Discount[];
  paymentMethod?: string;
  deliveryAddress?: string;
  invoiceAddress?: string;
  recipientName?: string;
  orderDate?: string;
  deliveryType?: string;
  deliveryDeadlineLabel?: string;
  deliveryDeadline?: string;
  cargoHandOverLabel?: string;
  cargoHandOverDate?: string;

  buyer?: { name?: string; email?: string };
  seller?: { title?: string; address?: string; tax?: string };
  platform?: { title?: string; address?: string };
};

export default function AgreementsCheckbox(props: AgreementsCheckboxProps) {
  const { value, onChange, ...input } = props;

  // modal state
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"preinfo" | "distance">("preinfo");

  // dinamik sözleşme metinleri — Summary verilerinden üretilir
  const { loading, preInfoHTML, distanceSalesHTML } = useAgreementsDocs(input);

  // kullanıcı doğrudan checkbox'a basarsa önce modal aç
  const tryTogglePre = () => {
    if (!value.preInfoAccepted) setTab("preinfo"), setOpen(true);
    else onChange(p => ({ ...p, preInfoAccepted: false }));
  };
  const tryToggleDist = () => {
    if (!value.distanceAccepted) setTab("distance"), setOpen(true);
    else onChange(p => ({ ...p, distanceAccepted: false }));
  };

  return (
    <>
      <div className="space-y-3 bg-neutral-50/60 border rounded-2xl p-4">
        <AgreementRow
          checked={value.preInfoAccepted}
          onToggle={tryTogglePre}
          label={
            <>
              Ön Bilgilendirme Koşullarını{" "}
              <button type="button" onClick={() => (setTab("preinfo"), setOpen(true))}
                className="underline underline-offset-2 hover:no-underline text-orange-600">
                oku
              </button>{" "}
              ve kabul ediyorum.
            </>
          }
        />

        <AgreementRow
          checked={value.distanceAccepted}
          onToggle={tryToggleDist}
          label={
            <>
              Mesafeli Satış Sözleşmesi’ni{" "}
              <button type="button" onClick={() => (setTab("distance"), setOpen(true))}
                className="underline underline-offset-2 hover:no-underline text-orange-600">
                oku
              </button>{" "}
              ve kabul ediyorum.
            </>
          }
        />
      </div>

      <AgreementsModal
        open={open}
        onOpenChange={setOpen}
        defaultTab={tab}
        preInfoHTML={loading ? "<p>Yükleniyor…</p>" : preInfoHTML}
        distanceSalesHTML={loading ? "<p>Yükleniyor…</p>" : distanceSalesHTML}
        onAcceptPreInfo={() => onChange(p => ({ ...p, preInfoAccepted: true }))}
        onAcceptDistance={() => onChange(p => ({ ...p, distanceAccepted: true }))}
      />
    </>
  );
}

function AgreementRow({
  checked, onToggle, label,
}: { checked: boolean; onToggle: () => void; label: React.ReactNode }) {
  return (
    <label className="group flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-5 w-5 rounded-md border-neutral-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
      />
      <span className="text-sm text-neutral-800 leading-6">{label}</span>
    </label>
  );
}
