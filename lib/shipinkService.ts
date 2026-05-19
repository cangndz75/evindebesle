import { getShipinkAccessToken } from "@/lib/shipinkAuthService";

const SHIPINK_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.shipink.io'
  : 'https://api.dev.shipink.io';

/**
 * DB-backed OAuth2 token.
 * Tüm mevcut çağrılar uyumlu kalsın diye aynı imza korunuyor.
 */
export async function getShipinkToken(): Promise<string> {
  return getShipinkAccessToken();
}

export async function createShipinkOrder(token: string, orderData: any): Promise<string> {
  const response = await fetch(`${SHIPINK_API_URL}/orders`, {
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

export async function createOutgoingShipment(
  token: string,
  shipinkOrderId: string,
  packagesData: any[]
) {
  const CARRIER_SERVICE_ID = process.env.SHIPINK_CARRIER_SERVICE_ID || "";
  const CARRIER_ACCOUNT_ID = process.env.SHIPINK_CARRIER_ACCOUNT_ID || "";
  const WAREHOUSE_ID = process.env.SHIPINK_WAREHOUSE_ID || "";

  const response = await fetch(`${SHIPINK_API_URL}/shipments`, {
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
  const response = await fetch(`${SHIPINK_API_URL}/shipments`, {
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
