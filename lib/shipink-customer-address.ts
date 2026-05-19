/**
 * Shipink order/shipment adres alanları: street, district (ilçe), city (il), zip, country_code.
 * @see https://shipink.dev — state kullanılmıyor; ilçe `district` alanına gider.
 */

export type ShipinkAddressSource = {
  fullAddress?: string | null;
  fullName?: string | null;
  phone?: string | null;
  district?: { name?: string | null; city?: string | null } | null;
} | null;

export function buildShipinkCustomerAddress(addr: ShipinkAddressSource) {
  const city = addr?.district?.city?.trim() || "";
  const district = addr?.district?.name?.trim() || "";

  return {
    street: addr?.fullAddress?.trim() || "",
    district,
    city,
    zip: "",
    country_code: "TR",
  };
}

export function buildShipinkCustomerBlock(order: {
  user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  shippingAddress?: ShipinkAddressSource;
}) {
  const addr = order.shippingAddress ?? null;
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
