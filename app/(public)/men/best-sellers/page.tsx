import { Suspense } from "react";
import MenBestSellersPage from "../../_components/MenBestSellersPage";

export const metadata = {
  title: "Erkek En Çok Satanlar - Dark Velvet",
  description: "Dark Velvet erkek premium iç çamaşırı koleksiyonunda en çok satan ürünler.",
};

export default function MenBestSellersPageRoute() {
  return (
    <Suspense fallback={null}>
      <MenBestSellersPage />
    </Suspense>
  );
}
