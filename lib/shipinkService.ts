const SHIPINK_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.shipink.io'
  : 'https://api.dev.shipink.io';

const SHIPINK_EMAIL = process.env.SHIPINK_EMAIL as string;
const SHIPINK_PASSWORD = process.env.SHIPINK_PASSWORD as string;

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getShipinkToken(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(`${SHIPINK_API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SHIPINK_EMAIL, password: SHIPINK_PASSWORD }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Shipink Token Hatası: ${errorData.error_description || 'Bilinmeyen hata'}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);

  return cachedToken as string;
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
