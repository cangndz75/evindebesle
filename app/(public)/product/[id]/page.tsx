import ProductDetailPage from "../../_components/ProductDetailPage";
import { bestSellersWomen, bestSellersMen, newArrivals } from "@/lib/homeData";

// Mock product data - Later will be fetched from database
function getProductById(id: string) {
  // Combine all products
  const allProducts = [
    ...bestSellersWomen.map((p) => ({
      id: p.id,
      name: p.title,
      price: p.price,
      originalPrice: undefined,
      description: "Premium kalite ve zarif tasarım. Günlük kullanım için ideal.",
      images: [
        { url: p.image.startsWith("http") ? p.image : "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop", badge: p.badge },
        { url: p.hoverImage?.startsWith("http") ? p.hoverImage : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop", badge: undefined },
      ],
      colors: p.colors?.map((c, idx) => ({
        name: typeof c === "string" ? `Renk ${idx + 1}` : c,
        value: typeof c === "string" ? c : "#000000",
      })) || [],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      details: [
        "Premium kumaş",
        "Zarif tasarım",
        "Günlük kullanım için ideal",
      ],
      fabric: "Polyester %85, Elastan %15",
      care: "Yumuşak deterjanla yıkayın",
      washing: "30°C'de yıkayın",
      delivery: "2-3 iş günü içinde teslimat",
      sizeNotes: "True to size - Kalıbına uygun",
    })),
    ...bestSellersMen.map((p) => ({
      id: p.id,
      name: p.title,
      price: p.price,
      originalPrice: undefined,
      description: "Premium kalite ve zarif tasarım. Günlük kullanım için ideal.",
      images: [
        { url: p.image.startsWith("http") ? p.image : "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop", badge: p.badge },
        { url: p.hoverImage?.startsWith("http") ? p.hoverImage : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop", badge: undefined },
      ],
      colors: p.colors?.map((c, idx) => ({
        name: typeof c === "string" ? `Renk ${idx + 1}` : c,
        value: typeof c === "string" ? c : "#000000",
      })) || [],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      details: [
        "Premium kumaş",
        "Zarif tasarım",
        "Günlük kullanım için ideal",
      ],
      fabric: "Polyester %85, Elastan %15",
      care: "Yumuşak deterjanla yıkayın",
      washing: "30°C'de yıkayın",
      delivery: "2-3 iş günü içinde teslimat",
      sizeNotes: "True to size - Kalıbına uygun",
    })),
    ...newArrivals.map((p) => ({
      id: p.id,
      name: p.title,
      price: p.price,
      originalPrice: undefined,
      description: "Premium kalite ve zarif tasarım. Günlük kullanım için ideal.",
      images: [
        { url: p.image.startsWith("http") ? p.image : "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop", badge: p.badge || "Yeni" },
        { url: p.hoverImage?.startsWith("http") ? p.hoverImage : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop", badge: undefined },
      ],
      colors: p.colors?.map((c, idx) => ({
        name: typeof c === "string" ? `Renk ${idx + 1}` : c,
        value: typeof c === "string" ? c : "#000000",
      })) || [],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      details: [
        "Premium kumaş",
        "Zarif tasarım",
        "Günlük kullanım için ideal",
      ],
      fabric: "Polyester %85, Elastan %15",
      care: "Yumuşak deterjanla yıkayın",
      washing: "30°C'de yıkayın",
      delivery: "2-3 iş günü içinde teslimat",
      sizeNotes: "True to size - Kalıbına uygun",
    })),
  ];

  return allProducts.find((p) => p.id === id) || null;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Ürün bulunamadı</h1>
          <a href="/home" className="text-sm text-gray-600 hover:text-black">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  return <ProductDetailPage product={product} />;
}
