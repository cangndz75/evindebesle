const BASITKARGO_API_URL = "https://basitkargo.com/api";
const BASITKARGO_API_TOKEN = process.env.BASITKARGO_API_TOKEN || "";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${BASITKARGO_API_TOKEN}`,
  };
}

export function isBasitKargoConfigured(): boolean {
  return !!BASITKARGO_API_TOKEN;
}

async function bkFetch<T = any>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BASITKARGO_API_URL}${path}`;
  const res = await fetch(url, { ...init, headers: { ...headers(), ...init?.headers } });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`BasitKargo ${res.status}: ${text || res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}

// ─── Kargo firmaları ───

export type BasitKargoHandler = { name: string; code: string; logo: string };

export async function getHandlers(): Promise<BasitKargoHandler[]> {
  return bkFetch<BasitKargoHandler[]>("/handlers");
}

// ─── Fiyat sorgulama ───

export type BasitKargoFee = {
  desiKg: number;
  handlerCode: string;
  price: number;
  codFee?: number | null;
};

export async function getFeeByDesiKg(desiKg: number): Promise<BasitKargoFee[]> {
  return bkFetch<BasitKargoFee[]>(`/handlers/fee/desiKg/${desiKg}`);
}

// ─── Sipariş + barkod (tek adımda) ───

export type BasitKargoOrderPayload = {
  handlerCode: string;
  type?: "OUTGOING" | "INCOMING";
  content: {
    name: string;
    code: string;
    items?: Array<{ name: string; code?: string; quantity: string }>;
    packages?: Array<{ height: number; width: number; depth: number; weight: number }>;
  };
  client: {
    name: string;
    phone: string;
    city: string;
    town: string;
    address: string;
  };
  collect?: number;
  collectOnDeliveryType?: "CASH" | "CREDIT_CARD";
  addressId?: string;
  brandId?: string;
};

export type BasitKargoOrderResult = {
  id: string;
  barcode: string | null;
  type: string;
  status: string;
  validationFailed: boolean;
  createdTime: string;
};

export async function createOrderWithBarcode(
  payload: BasitKargoOrderPayload,
): Promise<BasitKargoOrderResult> {
  return bkFetch<BasitKargoOrderResult>("/v2/order/barcode", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createOrder(
  payload: Omit<BasitKargoOrderPayload, "handlerCode"> & { handlerCode?: string },
): Promise<BasitKargoOrderResult> {
  return bkFetch<BasitKargoOrderResult>("/v2/order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── İade kodu oluşturma ───

export async function createReturnBarcode(barcode: string): Promise<any> {
  return bkFetch(`/v2/order/return/barcode/${encodeURIComponent(barcode)}`);
}

// ─── Etiket SVG ───

export async function getLabelSvg(orderId: string): Promise<string> {
  return bkFetch<string>(`/label/svg/${encodeURIComponent(orderId)}`);
}

// ─── Sipariş sorgulama ───

export async function getOrderById(orderId: string): Promise<any> {
  return bkFetch(`/v2/order/${encodeURIComponent(orderId)}`);
}

export async function getOrderByBarcode(barcode: string): Promise<any> {
  return bkFetch(`/v2/order/barcode/${encodeURIComponent(barcode)}`);
}

// ─── Barkod iptal ───

export async function cancelBarcode(barcode: string): Promise<any> {
  return bkFetch(`/order/barcode/${encodeURIComponent(barcode)}`, { method: "DELETE" });
}

// ─── Bakiye ───

export async function getBalance(): Promise<number> {
  return bkFetch<number>("/firm/balance");
}
