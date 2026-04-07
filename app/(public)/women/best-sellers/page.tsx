import { Suspense } from "react";
import WomenBestSellersPage from "../../_components/WomenBestSellersPage";

export const metadata = {
  title: "Kadın En Çok Satanlar - Dark Velvet",
  description: "Dark Velvet kadın premium iç çamaşırı koleksiyonunda en çok satan ürünler.",
};

export default function WomenBestSellersPageRoute() {
  return (
    <Suspense fallback={null}>
      <WomenBestSellersPage />
    </Suspense>
  );
}
