/**
 * Shipink order/shipment adres alanları.
 *
 * Shipink TR paneli:
 * - "İl" → `state` (il / province)
 * - "İlçe" → `city` ve `district` (ilçe)
 * - `street` → açık adres satırı
 */

export type ShipinkAddressSource = {
  fullAddress?: string | null;
  fullName?: string | null;
  phone?: string | null;
  district?: { name?: string | null; city?: string | null } | null;
} | null;

export type ResolvedShipinkAddress = {
  street: string;
  /** İlçe */
  city: string;
  /** İlçe (API dokümantasyonu) */
  district: string;
  /** İl / province */
  state: string;
  zip: string;
  country_code: string;
};

function resolveProvinceAndDistrict(addr: ShipinkAddressSource): { province: string; county: string } {
  const province = addr?.district?.city?.trim() || "";
  const county = addr?.district?.name?.trim() || "";
  return { province, county };
}

export function buildShipinkCustomerAddress(addr: ShipinkAddressSource): ResolvedShipinkAddress {
  const { province, county } = resolveProvinceAndDistrict(addr);

  return {
    street: addr?.fullAddress?.trim() || "",
    state: province,
    city: county,
    district: county,
    zip: "",
    country_code: "TR",
  };
}

export function buildShipinkCustomerBlock(order: {
  user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  shippingAddress?: ShipinkAddressSource;
  billingAddress?: ShipinkAddressSource;
}) {
  const addr = order.shippingAddress ?? order.billingAddress ?? null;
  const name = order.user?.name || addr?.fullName || "Müşteri";
  const phone = order.user?.phone || addr?.phone || "";
  const email = order.user?.email || "";

  return {
    name,
    email: { main: email, work: "" },
    phone: { main: phone, work: "", cell: "", code: "" },
    address: buildShipinkCustomerAddress(addr),
  };
}
