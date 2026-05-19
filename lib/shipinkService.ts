import { getShipinkAccessToken } from "@/lib/shipinkAuthService";
import { getShipinkApiBaseUrl } from "@/lib/shipinkApiBase";
import type { buildShipinkCustomerBlock } from "@/lib/shipink-customer-address";

/**
 * DB-backed OAuth2 token.
 * Tüm mevcut çağrılar uyumlu kalsın diye aynı imza korunuyor.
 */
export async function getShipinkToken(): Promise<string> {
  return getShipinkAccessToken();
}

export async function createShipinkOrder(token: string, orderData: any): Promise<string> {
  const response = await fetch(`${getShipinkApiBaseUrl()}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Shipink sipariş oluşturulamadı.');
  }

  return result.data.id;
}

/** Mevcut Shipink siparişinde alıcı adresini günceller (il/ilçe düzeltmesi vb.). */
export async function updateShipinkOrderCustomer(
  token: string,
  shipinkOrderId: string,
  customer: ReturnType<typeof buildShipinkCustomerBlock>,
): Promise<boolean> {
  const response = await fetch(`${getShipinkApiBaseUrl()}/orders/${shipinkOrderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ customer }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.warn(
      `[Shipink] PUT /orders/${shipinkOrderId} adres güncelleme ${response.status}: ${body.slice(0, 200)}`,
    );
    return false;
  }

  return true;
}

export async function createOutgoingShipment(
  token: string,
  shipinkOrderId: string,
  packagesData: any[]
) {
  const CARRIER_SERVICE_ID = process.env.SHIPINK_CARRIER_SERVICE_ID || "";
  const CARRIER_ACCOUNT_ID = process.env.SHIPINK_CARRIER_ACCOUNT_ID || "";
  const WAREHOUSE_ID = process.env.SHIPINK_WAREHOUSE_ID || "";

  const response = await fetch(`${getShipinkApiBaseUrl()}/shipments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      order_id: shipinkOrderId,
      direction: "outgoing",
      ...(CARRIER_SERVICE_ID && { carrier_service_id: CARRIER_SERVICE_ID }),
      ...(CARRIER_ACCOUNT_ID && { carrier_account_id: CARRIER_ACCOUNT_ID }),
      ...(WAREHOUSE_ID && { warehouse_id: WAREHOUSE_ID }),
      packages: packagesData
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Shipink giden gönderi oluşturulamadı.');
  }

  return result.data;
}

export async function createReturnShipment(token: string, shipinkOrderId: string, packagesData: any[]) {
  const response = await fetch(`${getShipinkApiBaseUrl()}/shipments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      order_id: shipinkOrderId,
      direction: "incoming",
      packages: packagesData
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Shipink iade gönderisi oluşturulamadı.');
  }

  return result.data;
}
