// Sepet yardımcı fonksiyonları - localStorage için

export interface GuestCartItem {
  id: string;
  productId: string;
  colorId: string | null;
  sizeId: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    image: string | null;
    price: number;
  };
  color?: {
    id: string;
    name: string;
  } | null;
  size?: {
    id: string;
    name: string;
  } | null;
}

// localStorage'dan sepeti getir
export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const cart = localStorage.getItem("guestCart");
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

// localStorage'a sepeti kaydet
export function saveGuestCart(items: GuestCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("guestCart", JSON.stringify(items));
    // Sepet güncelleme event'ini tetikle (next tick'te)
    setTimeout(() => {
      window.dispatchEvent(new Event("cartUpdated"));
    }, 0);
  } catch (error) {
    console.error("Error saving guest cart:", error);
  }
}

// Sepete ürün ekle (localStorage için)
export function addToGuestCart(
  productId: string,
  colorId: string | null,
  sizeId: string | null,
  quantity: number,
  product: {
    id: string;
    name: string;
    image: string | null;
    price: number;
  },
  color?: { id: string; name: string } | null,
  size?: { id: string; name: string } | null
): GuestCartItem {
  const cart = getGuestCart();
  
  // Aynı ürün, renk ve beden kombinasyonunu kontrol et
  const existingIndex = cart.findIndex(
    (item) =>
      item.productId === productId &&
      item.colorId === (colorId || null) &&
      item.sizeId === (sizeId || null)
  );

  if (existingIndex >= 0) {
    // Varsa miktarı artır
    cart[existingIndex].quantity += quantity;
    saveGuestCart(cart);
    return cart[existingIndex];
  } else {
    // Yoksa yeni ekle
    const newItem: GuestCartItem = {
      id: `guest-${Date.now()}-${Math.random()}`,
      productId,
      colorId: colorId || null,
      sizeId: sizeId || null,
      quantity,
      product,
      color: color || null,
      size: size || null,
    };
    cart.push(newItem);
    saveGuestCart(cart);
    return newItem;
  }
}

// Sepetten ürün sil
export function removeFromGuestCart(itemId: string): void {
  const cart = getGuestCart();
  const filtered = cart.filter((item) => item.id !== itemId);
  saveGuestCart(filtered);
}

// Sepet sayısını hesapla
export function getGuestCartCount(): number {
  const cart = getGuestCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
