export class ShipinkService {
  baseUrl = process.env.SHIPINK_API_URL!;
  username = process.env.SHIPINK_USERNAME!;
  password = process.env.SHIPINK_PASSWORD!;
  accessToken: string | null = null;

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
    });
    if (!response.ok) throw new Error('Shipink yetkilendirme hatası!');
    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) await this.authenticate();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
      ...(options.headers || {}),
    };
    let response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      await this.authenticate();
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    }
    return response.json();
  }

  async createOrder(orderData: any) {
    return this.fetchWithAuth('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async createShipment(shipmentData: any) {
    return this.fetchWithAuth('/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async getTracking(trackingCode: string) {
    return this.fetchWithAuth(`/trackings/${trackingCode}`, { method: 'GET' });
  }
}

export const shipinkClient = new ShipinkService();
