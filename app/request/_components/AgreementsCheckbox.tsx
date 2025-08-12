"use client";

import React from "react";
import AgreementsModal, { PRE_INFO_HTML, DISTANCE_SALES_HTML } from "./AgreementsModal";

type AgreementsState = {
  preInfoAccepted: boolean;
  distanceAccepted: boolean;
};

type AgreementsCheckboxProps = {
  value: AgreementsState;
  onChange: (next: AgreementsState) => void;

  // Modal için dinamik veriler
  items: { description: string; quantity: number; unitPrice: number; subtotal?: number }[];
  shippingFee?: number;
  discounts?: { label: string; amount: number }[];
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
};

export default function AgreementsCheckbox({
  value,
  onChange,
  items,
  shippingFee,
  discounts,
  paymentMethod,
  deliveryAddress,
  invoiceAddress,
  recipientName,
  orderDate,
  deliveryType,
  deliveryDeadlineLabel,
  deliveryDeadline,
  cargoHandOverLabel,
  cargoHandOverDate,
}: AgreementsCheckboxProps) {
  const [open, setOpen] = React.useState(false);
  const [modalTab, setModalTab] = React.useState<"preinfo" | "distance">("preinfo");

  const openModal = (tab: "preinfo" | "distance") => {
    setModalTab(tab);
    setOpen(true);
  };

  return (
    <>
      <div className="space-y-3 bg-neutral-50/60 border rounded-2xl p-4">
        <AgreementRow
          checked={value.preInfoAccepted}
          onToggle={() => onChange({ ...value, preInfoAccepted: !value.preInfoAccepted })}
          label={
            <>
              Ön Bilgilendirme Koşullarını{" "}
              <button type="button" onClick={() => openModal("preinfo")} className="underline underline-offset-2 hover:no-underline text-orange-600">
                oku
              </button>{" "}
              ve kabul ediyorum.
            </>
          }
        />
        <AgreementRow
          checked={value.distanceAccepted}
          onToggle={() => onChange({ ...value, distanceAccepted: !value.distanceAccepted })}
          label={
            <>
              Mesafeli Satış Sözleşmesi’ni{" "}
              <button type="button" onClick={() => openModal("distance")} className="underline underline-offset-2 hover:no-underline text-orange-600">
                oku
              </button>{" "}
              ve kabul ediyorum.
            </>
          }
        />
      </div>

      <AgreementsModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultTab={modalTab}
        items={items}
        shippingFee={shippingFee}
        discounts={discounts}
        paymentMethod={paymentMethod}
        deliveryAddress={deliveryAddress}
        invoiceAddress={invoiceAddress}
        recipientName={recipientName}
        orderDate={orderDate}
        deliveryType={deliveryType}
        deliveryDeadlineLabel={deliveryDeadlineLabel}
        deliveryDeadline={deliveryDeadline}
        cargoHandOverLabel={cargoHandOverLabel}
        cargoHandOverDate={cargoHandOverDate}
        preInfoHTML={PRE_INFO_HTML}
        distanceSalesHTML={DISTANCE_SALES_HTML}
      />
    </>
  );
}

function AgreementRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: React.ReactNode;
}) {
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
