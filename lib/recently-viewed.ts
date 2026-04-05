
export interface RecentlyViewedProduct {
  id: string;
  productId: string;
  name: string;
  slug?: string;
  price: number;
  image: string | null;
  primaryImage: string | null;
  viewedAt: number; // timestamp
}

const STORAGE_KEY = "recentlyViewedProducts";
const MAX_ITEMS = 20; // Maksimum 20 ürün sakla

export function getRecentlyViewed(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const products: RecentlyViewedProduct[] = JSON.parse(stored);
    return products.sort((a, b) => b.viewedAt - a.viewedAt);
  } catch (error) {
    console.error("Error reading recently viewed products:", error);
    return [];
  }
}

export function addToRecentlyViewed(product: {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image?: string | null;
  primaryImage?: string | null;
}): void {
  if (typeof window === "undefined") return;
  
  try {
    const products = getRecentlyViewed();
    
    const filtered = products.filter((p) => p.productId !== product.id);
    
    const newProduct: RecentlyViewedProduct = {
      id: `view-${Date.now()}-${Math.random()}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image || product.primaryImage || null,
      primaryImage: product.primaryImage || product.image || null,
      viewedAt: Date.now(),
    };
    
    filtered.unshift(newProduct);
    
    const limited = filtered.slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    
    window.dispatchEvent(new Event("recentlyViewedUpdated"));
  } catch (error) {
    console.error("Error saving recently viewed product:", error);
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("recentlyViewedUpdated"));
  } catch (error) {
    console.error("Error clearing recently viewed products:", error);
  }
}

export function removeFromRecentlyViewed(productId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const products = getRecentlyViewed();
    const filtered = products.filter((p) => p.productId !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("recentlyViewedUpdated"));
  } catch (error) {
    console.error("Error removing recently viewed product:", error);
  }
}
