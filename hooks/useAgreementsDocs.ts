"use client";
import { useEffect, useState } from "react";

type LineItem = { description:string; quantity:number; unitPrice:number; subtotal?:number };
type Discount = { label: string; amount: number };

export function useAgreementsDocs(input: {
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
  buyer?: { name?:string; email?:string };
  seller?: { title?:string; address?:string; tax?:string };
  platform?: { title?:string; address?:string };
}) {
  const [loading, setLoading] = useState(true);
  const [preInfoHTML, setPre] = useState<string>("");
  const [distanceSalesHTML, setDist] = useState<string>("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/legal/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!ignore) {
        setPre(data.preInfoHTML || "");
        setDist(data.distanceSalesHTML || "");
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(input)]);

  return { loading, preInfoHTML, distanceSalesHTML };
}
