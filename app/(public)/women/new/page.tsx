import { Suspense } from "react";
import WomenNewArrivalsPage from "../../_components/WomenNewArrivalsPage";

export const metadata = {
  title: "Kadın Yeni Çıkanlar - Dark Velvet",
  description: "Dark Velvet kadın premium iç çamaşırı koleksiyonunda yeni çıkan ürünler.",
};

export default function WomenNewArrivalsPageRoute() {
  return (
    <Suspense fallback={null}>
      <WomenNewArrivalsPage />
    </Suspense>
  );
}
